import "server-only";

import type { Prisma } from "@prisma/client";

import {
  AI_USAGE_POLICY,
  AiUsageFeature,
  OPENAI_REQUEST_TIMEOUT_MS,
  type AiUsageFeature as AiUsageFeatureValue,
} from "@/features/ai-usage/policy";
import { prisma } from "@/server/db/prisma";

const RESERVATION_TTL_MS = 60_000;
const MAX_CONCURRENT_AI_REQUESTS_PER_USER = 1;
const AiUsageReservationStatus = {
  COMPLETED: "COMPLETED",
  PENDING: "PENDING",
  RELEASED: "RELEASED",
} as const;
type AiUsageReservationSettlementStatus =
  | (typeof AiUsageReservationStatus)["COMPLETED"]
  | (typeof AiUsageReservationStatus)["RELEASED"];

export { AiUsageFeature };
export { OPENAI_REQUEST_TIMEOUT_MS };
export { MAX_CONCURRENT_AI_REQUESTS_PER_USER };

type AiUsageRejection = "CONCURRENCY_LIMIT" | "DAILY_LIMIT";

export type AiUsageReservationResult =
  | {
      reservationId: string;
      status: "reserved";
    }
  | {
      reason: AiUsageRejection;
      status: "rejected";
    };

function getUtcDayStart(now: Date) {
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  return dayStart;
}

async function releaseExpiredReservationsForUser(
  transaction: Prisma.TransactionClient,
  userId: string,
  now: Date,
) {
  const expiredReservations = await transaction.aiUsageReservation.findMany({
    where: {
      userId,
      status: AiUsageReservationStatus.PENDING,
      expiresAt: {
        lt: now,
      },
    },
    select: {
      id: true,
      usageDayId: true,
    },
  });

  for (const reservation of expiredReservations) {
    const released = await transaction.aiUsageReservation.updateMany({
      where: {
        id: reservation.id,
        status: AiUsageReservationStatus.PENDING,
      },
      data: {
        releasedAt: now,
        status: AiUsageReservationStatus.RELEASED,
      },
    });

    if (released.count === 0) {
      continue;
    }

    await transaction.aiUsageDaily.updateMany({
      where: {
        id: reservation.usageDayId,
        inFlight: {
          gt: 0,
        },
      },
      data: {
        inFlight: {
          decrement: 1,
        },
        remaining: {
          increment: 1,
        },
      },
    });
    await transaction.aiUsageConcurrency.updateMany({
      where: {
        userId,
        activeRequests: {
          gt: 0,
        },
      },
      data: {
        activeRequests: {
          decrement: 1,
        },
      },
    });
  }
}

export async function reserveAiUsage(
  userId: string,
  feature: AiUsageFeatureValue,
  now = new Date(),
): Promise<AiUsageReservationResult> {
  const policy = AI_USAGE_POLICY[feature];
  const day = getUtcDayStart(now);

  return prisma.$transaction(async (transaction) => {
    // A crashed request must not permanently consume an in-flight slot. The provider
    // deadline is shorter than this lease, so a reclaimed request cannot still be valid.
    await releaseExpiredReservationsForUser(transaction, userId, now);

    const usageDay = await transaction.aiUsageDaily.upsert({
      where: {
        userId_quota_day: {
          day,
          quota: policy.quota,
          userId,
        },
      },
      create: {
        day,
        quota: policy.quota,
        remaining: policy.dailyLimit,
        userId,
      },
      update: {},
    });

    const consumedQuota = await transaction.aiUsageDaily.updateMany({
      where: {
        id: usageDay.id,
        remaining: {
          gt: 0,
        },
      },
      data: {
        inFlight: {
          increment: 1,
        },
        remaining: {
          decrement: 1,
        },
      },
    });

    if (consumedQuota.count === 0) {
      return { reason: "DAILY_LIMIT", status: "rejected" };
    }

    await transaction.aiUsageConcurrency.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const claimedConcurrency = await transaction.aiUsageConcurrency.updateMany({
      where: {
        activeRequests: {
          lt: MAX_CONCURRENT_AI_REQUESTS_PER_USER,
        },
        userId,
      },
      data: {
        activeRequests: {
          increment: 1,
        },
      },
    });

    if (claimedConcurrency.count === 0) {
      await transaction.aiUsageDaily.updateMany({
        where: {
          id: usageDay.id,
          inFlight: {
            gt: 0,
          },
        },
        data: {
          inFlight: {
            decrement: 1,
          },
          remaining: {
            increment: 1,
          },
        },
      });
      return { reason: "CONCURRENCY_LIMIT", status: "rejected" };
    }

    const reservation = await transaction.aiUsageReservation.create({
      data: {
        expiresAt: new Date(now.getTime() + RESERVATION_TTL_MS),
        feature,
        usageDayId: usageDay.id,
        userId,
      },
      select: {
        id: true,
      },
    });

    return { reservationId: reservation.id, status: "reserved" };
  });
}

async function settleAiUsageReservation(
  reservationId: string,
  status: AiUsageReservationSettlementStatus,
  now = new Date(),
) {
  return prisma.$transaction(async (transaction) => {
    const reservation = await transaction.aiUsageReservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        usageDayId: true,
        userId: true,
      },
    });

    if (!reservation) {
      return false;
    }

    const updated = await transaction.aiUsageReservation.updateMany({
      where: {
        id: reservation.id,
        status: AiUsageReservationStatus.PENDING,
      },
      data:
        status === AiUsageReservationStatus.COMPLETED
          ? {
              completedAt: now,
              status,
            }
          : {
              releasedAt: now,
              status,
            },
    });

    if (updated.count === 0) {
      return false;
    }

    await transaction.aiUsageDaily.updateMany({
      where: {
        id: reservation.usageDayId,
        inFlight: {
          gt: 0,
        },
      },
      data:
        status === AiUsageReservationStatus.COMPLETED
          ? {
              inFlight: {
                decrement: 1,
              },
            }
          : {
              inFlight: {
                decrement: 1,
              },
              remaining: {
                increment: 1,
              },
            },
    });
    await transaction.aiUsageConcurrency.updateMany({
      where: {
        activeRequests: {
          gt: 0,
        },
        userId: reservation.userId,
      },
      data: {
        activeRequests: {
          decrement: 1,
        },
      },
    });

    return true;
  });
}

export function completeAiUsageReservation(reservationId: string) {
  return settleAiUsageReservation(
    reservationId,
    AiUsageReservationStatus.COMPLETED,
  );
}

export function releaseAiUsageReservation(reservationId: string) {
  return settleAiUsageReservation(
    reservationId,
    AiUsageReservationStatus.RELEASED,
  );
}

export function getAiDailyLimit(feature: AiUsageFeatureValue) {
  return AI_USAGE_POLICY[feature].dailyLimit;
}
