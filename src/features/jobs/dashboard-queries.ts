import type { Prisma } from "@prisma/client";

import { requireUser } from "@/features/auth/require-user";
import { prisma } from "@/server/db/prisma";

type TrackedStatus =
  | "SAVED"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED"
  | "ARCHIVED";

const emptyStatusCounts: Record<TrackedStatus, number> = {
  SAVED: 0,
  APPLIED: 0,
  INTERVIEWING: 0,
  OFFER: 0,
  REJECTED: 0,
  ARCHIVED: 0,
};

type RecentDashboardJob = Prisma.JobGetPayload<{
  select: {
    id: true;
    company: true;
    title: true;
    status: true;
    createdAt: true;
  };
}>;

type UpcomingDashboardJob = Prisma.JobGetPayload<{
  select: {
    id: true;
    company: true;
    title: true;
    deadline: true;
    followUpAt: true;
  };
}>;

export type DashboardSummary = {
  activeTotal: number;
  statusCounts: Record<TrackedStatus, number>;
  recentJobs: RecentDashboardJob[];
  upcomingJobs: UpcomingDashboardJob[];
};

export async function getDashboardSummaryForCurrentUser(): Promise<DashboardSummary> {
  const user = await requireUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [statusGroups, recentJobs, upcomingJobs] = await Promise.all([
    prisma.job.groupBy({
      by: ["status"],
      where: {
        userId: user.id,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.job.findMany({
      where: {
        userId: user.id,
        status: {
          not: "ARCHIVED",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        company: true,
        title: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.job.findMany({
      where: {
        userId: user.id,
        status: {
          not: "ARCHIVED",
        },
        OR: [
          {
            deadline: {
              gte: today,
            },
          },
          {
            followUpAt: {
              gte: today,
            },
          },
        ],
      },
      orderBy: [{ deadline: "asc" }, { followUpAt: "asc" }],
      take: 5,
      select: {
        id: true,
        company: true,
        title: true,
        deadline: true,
        followUpAt: true,
      },
    }),
  ]);

  const statusCounts = { ...emptyStatusCounts };

  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
  }

  const activeTotal =
    statusCounts.SAVED +
    statusCounts.APPLIED +
    statusCounts.INTERVIEWING +
    statusCounts.OFFER +
    statusCounts.REJECTED;

  return {
    activeTotal,
    statusCounts,
    recentJobs,
    upcomingJobs,
  };
}
