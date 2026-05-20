import { requireUser } from "@/features/auth/require-user";
import {
  buildTodayFocusSummary,
  type TodayFocusSummary,
} from "@/features/jobs/dashboard-focus";
import {
  isApplicationStatus,
  type ApplicationStatus,
} from "@/features/jobs/status";
import { prisma } from "@/server/db/prisma";

type StatusGroup = {
  status: ApplicationStatus;
  _count: {
    _all: number;
  };
};

const emptyStatusCounts: Record<ApplicationStatus, number> = {
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
  status: ApplicationStatus;
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
  statusCounts: Record<ApplicationStatus, number>;
  recentJobs: RecentDashboardJob[];
  upcomingJobs: UpcomingDashboardJob[];
  todayFocus: TodayFocusSummary;
};

function getStartOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function toStatusGroups(
  groups: Array<{
    status: string;
    _count: {
      _all: number;
    };
  }>,
): StatusGroup[] {
  return groups.flatMap((group) =>
    isApplicationStatus(group.status)
      ? [
          {
            status: group.status,
            _count: {
              _all: group._count._all,
            },
          },
        ]
      : [],
  );
}

export async function getDashboardSummaryForCurrentUser(): Promise<DashboardSummary> {
  const user = await requireUser();
  const now = new Date();
  const today = getStartOfDay(now);

  const rawStatusGroups = await prisma.job.groupBy({
    by: ["status"],
    where: {
      userId: user.id,
    },
    _count: {
      _all: true,
    },
  });

  const statusGroups = toStatusGroups(rawStatusGroups);

  const [recentJobs, upcomingJobs, activeJobsForFocus] = await Promise.all([
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
    prisma.job.findMany({
      where: {
        userId: user.id,
        status: {
          not: "ARCHIVED",
        },
      },
      select: {
        id: true,
        company: true,
        title: true,
        status: true,
        createdAt: true,
        deadline: true,
        followUpAt: true,
        analysis: {
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  const statusCounts: Record<ApplicationStatus, number> = {
    ...emptyStatusCounts,
  };

  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
  }

  const activeTotal =
    statusCounts.SAVED +
    statusCounts.APPLIED +
    statusCounts.INTERVIEWING +
    statusCounts.OFFER +
    statusCounts.REJECTED;

  const todayFocus = buildTodayFocusSummary(
    activeJobsForFocus.map((job) => ({
      id: job.id,
      company: job.company,
      title: job.title,
      status: job.status,
      createdAt: job.createdAt,
      deadline: job.deadline,
      followUpAt: job.followUpAt,
      hasAnalysis: job.analysis !== null,
    })),
    now,
  );

  return {
    activeTotal,
    statusCounts,
    recentJobs,
    upcomingJobs,
    todayFocus,
  };
}
