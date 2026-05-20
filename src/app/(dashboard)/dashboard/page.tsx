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
  const todayFocus = summary.todayFocus;

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Dashboard</h1>

      <section className="space-y-2.5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Today&apos;s Focus</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Priority actions to keep your search moving today.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Follow-ups Due</CardTitle>
              <CardDescription>{todayFocus.followUpsDue.count} job(s) need attention.</CardDescription>
            </CardHeader>
            <div className="space-y-2 px-6 pb-5">
              {todayFocus.followUpsDue.jobs.length > 0 ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Follow up on overdue or due-today check-ins.</p>
                  {todayFocus.followUpsDue.jobs.slice(0, 2).map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-md border border-slate-200 p-2 text-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:hover:bg-slate-800/60">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{job.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{job.company}</p>
                    </Link>
                  ))}
                </>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">No follow-ups due.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
              <CardDescription>{todayFocus.upcomingDeadlines.count} deadline(s) in 7 days.</CardDescription>
            </CardHeader>
            <div className="space-y-2 px-6 pb-5">
              {todayFocus.upcomingDeadlines.jobs.length > 0 ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Handle the closest deadlines first.</p>
                  {todayFocus.upcomingDeadlines.jobs.slice(0, 2).map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-md border border-slate-200 p-2 text-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:hover:bg-slate-800/60">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{job.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {job.company}
                        {job.deadline ? ` - Due ${formatDate(job.deadline)}` : ""}
                      </p>
                    </Link>
                  ))}
                </>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">No upcoming deadlines.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Missing AI Analysis</CardTitle>
              <CardDescription>{todayFocus.missingAnalysis.count} active job(s) without analysis.</CardDescription>
            </CardHeader>
            <div className="space-y-2 px-6 pb-5">
              {todayFocus.missingAnalysis.jobs.length > 0 ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Open a job to run AI analysis before tailoring.</p>
                  {todayFocus.missingAnalysis.jobs.slice(0, 2).map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-md border border-slate-200 p-2 text-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:hover:bg-slate-800/60">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{job.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{job.company}</p>
                    </Link>
                  ))}
                </>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">All active jobs have analysis.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Interview Prep Opportunities</CardTitle>
              <CardDescription>{todayFocus.interviewPrepOpportunities.count} role(s) ready for prep.</CardDescription>
            </CardHeader>
            <div className="space-y-2 px-6 pb-5">
              {todayFocus.interviewPrepOpportunities.jobs.length > 0 ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Open these roles and use Interview Prep.</p>
                  {todayFocus.interviewPrepOpportunities.jobs.slice(0, 2).map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-md border border-slate-200 p-2 text-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:hover:bg-slate-800/60">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{job.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {job.company} - {statusLabels[job.status]}
                      </p>
                    </Link>
                  ))}
                </>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">No interview-prep opportunities yet.</p>
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ApplicationPipeline
            activeTotal={summary.activeTotal}
            statusCounts={summary.statusCounts}
          />
        </div>

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
      </section>

      <section>
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
      </section>
    </div>
  );
}
