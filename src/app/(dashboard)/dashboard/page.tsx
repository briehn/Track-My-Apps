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
import {
  type DashboardSummary,
  getDashboardSummaryForCurrentUser,
} from "@/features/jobs/dashboard-queries";
import { statusBadgeVariants, statusLabels } from "@/features/jobs/status";

const pipelineStatuses = ["SAVED", "APPLIED", "INTERVIEWING", "OFFER"] as const;

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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Workspace Overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            A focused overview of your active job search.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/jobs" variant="secondary">
            View jobs
          </LinkButton>
          <LinkButton href="/jobs/new">Add job</LinkButton>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Pipeline Overview</p>
            <Link
              href="/jobs?status=archived"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Archived: {summary.statusCounts.ARCHIVED}
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 xl:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active Jobs</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {summary.activeTotal}
              </p>
            </div>
            {pipelineStatuses.map((status) => (
              <div
                key={status}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="space-y-3">
                  <Badge variant={statusBadgeVariants[status]}>
                    {statusLabels[status]}
                  </Badge>
                  <span className="block text-2xl font-semibold text-slate-950">
                    {summary.statusCounts[status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Newest active jobs saved to your tracker.</CardDescription>
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
            <CardDescription>Deadlines and follow-ups for active jobs.</CardDescription>
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
