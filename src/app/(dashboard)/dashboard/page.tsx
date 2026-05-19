import Link from "next/link";

import { EmptyState } from "@/components/empty-states/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { ApplicationPipeline } from "@/features/jobs/components/application-pipeline";
import {
  type DashboardSummary,
  getDashboardSummaryForCurrentUser,
} from "@/features/jobs/dashboard-queries";
import { statusBadgeVariants, statusLabels } from "@/features/jobs/status";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export default async function DashboardPage() {
  const summary: DashboardSummary = await getDashboardSummaryForCurrentUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Your job search at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/jobs" variant="secondary">
            View jobs
          </LinkButton>
          <LinkButton href="/jobs/new">Add job</LinkButton>
        </div>
      </div>

      <ApplicationPipeline
        activeTotal={summary.activeTotal}
        statusCounts={summary.statusCounts}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest active roles.</CardDescription>
          </CardHeader>
          {summary.recentJobs.length > 0 ? (
            <div className="space-y-3">
              {summary.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-950">
                        {job.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {job.company}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 sm:items-end">
                      <Badge variant={statusBadgeVariants[job.status]}>
                        {statusLabels[job.status]}
                      </Badge>
                      <p className="text-xs text-slate-500">
                        Saved {formatDate(job.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active jobs yet"
              description="Add your first job to start tracking your search."
              action={<LinkButton href="/jobs/new">Add job</LinkButton>}
            />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Dates</CardTitle>
            <CardDescription>Deadlines and follow-ups.</CardDescription>
          </CardHeader>
          {summary.upcomingJobs.length > 0 ? (
            <div className="space-y-3">
              {summary.upcomingJobs.map((job) => {
                const date = job.deadline ?? job.followUpAt;
                const label = job.deadline ? "Deadline" : "Follow-up";

                return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                    <p className="text-sm font-medium text-slate-950">
                      {job.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{job.company}</p>
                    {date ? (
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {label} {formatDate(date)}
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No upcoming dates"
              description="Deadlines and follow-ups for active jobs will appear here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
