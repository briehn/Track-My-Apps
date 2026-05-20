import type { ApplicationStatus } from "@/features/jobs/status";

export type TodayFocusJob = {
  id: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  createdAt: Date;
  deadline: Date | null;
  followUpAt: Date | null;
  hasAnalysis: boolean;
};

type TodayFocusBucket = {
  count: number;
  jobs: Array<Pick<TodayFocusJob, "id" | "company" | "title" | "status" | "deadline" | "followUpAt">>;
};

export type TodayFocusSummary = {
  followUpsDue: TodayFocusBucket;
  upcomingDeadlines: TodayFocusBucket;
  missingAnalysis: TodayFocusBucket;
  interviewPrepOpportunities: TodayFocusBucket;
};

function getStartOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function buildTodayFocusSummary(
  activeJobs: TodayFocusJob[],
  now: Date,
): TodayFocusSummary {
  const todayStart = getStartOfDay(now);
  const todayEnd = getEndOfDay(now);
  const nextSevenDaysEnd = new Date(todayEnd);
  nextSevenDaysEnd.setDate(nextSevenDaysEnd.getDate() + 7);

  const followUpsDue = activeJobs
    .filter((job) => job.followUpAt !== null && job.followUpAt <= todayEnd)
    .sort((a, b) => {
      if (a.followUpAt === null || b.followUpAt === null) {
        return 0;
      }
      return a.followUpAt.getTime() - b.followUpAt.getTime();
    });

  const upcomingDeadlines = activeJobs
    .filter(
      (job) =>
        job.deadline !== null &&
        job.deadline >= todayStart &&
        job.deadline <= nextSevenDaysEnd,
    )
    .sort((a, b) => {
      if (a.deadline === null || b.deadline === null) {
        return 0;
      }
      return a.deadline.getTime() - b.deadline.getTime();
    });

  const missingAnalysis = activeJobs
    .filter((job) => !job.hasAnalysis)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const interviewPrepOpportunities = activeJobs
    .filter((job) => job.status === "INTERVIEWING" || job.status === "OFFER")
    .sort((a, b) => {
      const aDate = a.followUpAt ?? a.deadline ?? a.createdAt;
      const bDate = b.followUpAt ?? b.deadline ?? b.createdAt;
      return aDate.getTime() - bDate.getTime();
    });

  return {
    followUpsDue: {
      count: followUpsDue.length,
      jobs: followUpsDue.slice(0, 3),
    },
    upcomingDeadlines: {
      count: upcomingDeadlines.length,
      jobs: upcomingDeadlines.slice(0, 3),
    },
    missingAnalysis: {
      count: missingAnalysis.length,
      jobs: missingAnalysis.slice(0, 3),
    },
    interviewPrepOpportunities: {
      count: interviewPrepOpportunities.length,
      jobs: interviewPrepOpportunities.slice(0, 3),
    },
  };
}
