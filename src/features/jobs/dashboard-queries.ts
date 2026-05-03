import type { ApplicationStatus } from "@prisma/client";

import { requireUser } from "@/features/auth/require-user";
import { prisma } from "@/server/db/prisma";

type TrackedStatus = ApplicationStatus;

type StatusGroup = {
  status: TrackedStatus;
  _count: {
    _all: number;
  };
};

const emptyStatusCounts: Record<TrackedStatus, number> = {
  SAVED: 0,
  APPLIED: 0,
  INTERVIEWING: 0,
  OFFER: 0,
  REJECTED: 0,
  ARCHIVED: 0,
};

type RecentDashboardJob = {
  id: string;
  company: string;
  title: string;
  status: TrackedStatus;
  createdAt: Date;
};

type UpcomingDashboardJob = {
  id: string;
  company: string;
  title: string;
  deadline: Date | null;
  followUpAt: Date | null;
};

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

  const statusGroupsPromise = prisma.job.groupBy({
      by: ["status"],
      where: {
        userId: user.id,
      },
      _count: {
        _all: true,
      },
    }) as unknown as Promise<StatusGroup[]>;

  const [statusGroups, recentJobs, upcomingJobs] = await Promise.all([
    statusGroupsPromise,
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
