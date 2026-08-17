import { afterEach, beforeAll, describe, expect, it } from "vitest";

import type { AiUsageFeature as AiUsageFeatureValue } from "@/features/ai-usage/policy";

const runDatabaseIntegrationTests =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === "true";
const createdUserIds: string[] = [];
const testDay = new Date("2026-08-16T12:00:00.000Z");

let aiUsage: typeof import("@/features/ai-usage/quota");
let prisma: typeof import("@/server/db/prisma").prisma;

async function createTestUser() {
  const suffix = crypto.randomUUID();
  const user = await prisma.user.create({
    data: {
      email: `ai-usage-${suffix}@example.test`,
    },
    select: { id: true },
  });
  createdUserIds.push(user.id);
  return user.id;
}

async function reserveOrFail(userId: string, feature: AiUsageFeatureValue) {
  const result = await aiUsage.reserveAiUsage(userId, feature, testDay);
  expect(result.status).toBe("reserved");

  if (result.status !== "reserved") {
    throw new Error("Expected an AI usage reservation.");
  }

  return result.reservationId;
}

describe.runIf(runDatabaseIntegrationTests)("AI usage quota PostgreSQL integration", () => {
  beforeAll(async () => {
    aiUsage = await import("@/features/ai-usage/quota");
    ({ prisma } = await import("@/server/db/prisma"));
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds.splice(0) } } });
    }
  });

  it("reserves below the limit and completes a successful request", async () => {
    const userId = await createTestUser();
    const reservationId = await reserveOrFail(
      userId,
      aiUsage.AiUsageFeature.JOB_ANALYSIS,
    );

    expect(await aiUsage.completeAiUsageReservation(reservationId)).toBe(true);

    const usage = await prisma.aiUsageDaily.findUniqueOrThrow({
      where: {
        userId_quota_day: {
          userId,
          quota: "JOB_ANALYSIS",
          day: new Date("2026-08-16T00:00:00.000Z"),
        },
      },
    });
    expect(usage).toMatchObject({ inFlight: 0, remaining: 2 });
  });

  it("rejects the limit before a further provider operation could begin", async () => {
    const userId = await createTestUser();

    for (let index = 0; index < 3; index += 1) {
      await aiUsage.completeAiUsageReservation(
        await reserveOrFail(userId, aiUsage.AiUsageFeature.JOB_ANALYSIS),
      );
    }

    await expect(
      aiUsage.reserveAiUsage(
        userId,
        aiUsage.AiUsageFeature.JOB_ANALYSIS,
        testDay,
      ),
    ).resolves.toEqual({ reason: "DAILY_LIMIT", status: "rejected" });
  });

  it("allows exactly one concurrent claim for the final quota slot", async () => {
    const userId = await createTestUser();

    for (let index = 0; index < 2; index += 1) {
      await aiUsage.completeAiUsageReservation(
        await reserveOrFail(userId, aiUsage.AiUsageFeature.JOB_ANALYSIS),
      );
    }

    const results = await Promise.all([
      aiUsage.reserveAiUsage(
        userId,
        aiUsage.AiUsageFeature.JOB_ANALYSIS,
        testDay,
      ),
      aiUsage.reserveAiUsage(
        userId,
        aiUsage.AiUsageFeature.JOB_ANALYSIS,
        testDay,
      ),
    ]);
    const reserved = results.filter((result) => result.status === "reserved");

    expect(reserved).toHaveLength(1);
  });

  it("rejects a second active AI request even when another quota has capacity", async () => {
    const userId = await createTestUser();
    const firstReservation = await reserveOrFail(
      userId,
      aiUsage.AiUsageFeature.JOB_ANALYSIS,
    );

    await expect(
      aiUsage.reserveAiUsage(
        userId,
        aiUsage.AiUsageFeature.JOB_MATCH,
        testDay,
      ),
    ).resolves.toEqual({ reason: "CONCURRENCY_LIMIT", status: "rejected" });

    expect(await aiUsage.releaseAiUsageReservation(firstReservation)).toBe(true);
  });

  it("refunds provider failures and timeouts without allowing a negative count", async () => {
    const userId = await createTestUser();
    const providerFailure = await reserveOrFail(
      userId,
      aiUsage.AiUsageFeature.JOB_ANALYSIS,
    );

    expect(await aiUsage.releaseAiUsageReservation(providerFailure)).toBe(true);
    expect(await aiUsage.releaseAiUsageReservation(providerFailure)).toBe(false);

    const timeout = await reserveOrFail(
      userId,
      aiUsage.AiUsageFeature.JOB_ANALYSIS,
    );
    expect(await aiUsage.releaseAiUsageReservation(timeout)).toBe(true);

    const usage = await prisma.aiUsageDaily.findFirstOrThrow({
      where: { userId, quota: "JOB_ANALYSIS" },
    });
    expect(usage).toMatchObject({ inFlight: 0, remaining: 3 });
  });

  it("isolates users and shares only the intentional job-match/interview-prep pool", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();

    for (let index = 0; index < 5; index += 1) {
      await aiUsage.completeAiUsageReservation(
        await reserveOrFail(userA, aiUsage.AiUsageFeature.JOB_MATCH),
      );
    }

    await expect(
      aiUsage.reserveAiUsage(
        userA,
        aiUsage.AiUsageFeature.INTERVIEW_PREP,
        testDay,
      ),
    ).resolves.toEqual({ reason: "DAILY_LIMIT", status: "rejected" });
    await expect(
      aiUsage.reserveAiUsage(
        userB,
        aiUsage.AiUsageFeature.INTERVIEW_PREP,
        testDay,
      ),
    ).resolves.toMatchObject({ status: "reserved" });
  });
});
