import Link from "next/link";

import { LinkButton } from "@/components/ui/link-button";
import { ApplicationPipeline } from "@/features/jobs/components/application-pipeline";
import { DashboardFocusSummary } from "@/features/jobs/components/dashboard-focus-summary";
import {
  type DashboardSummary,
  getDashboardSummaryForCurrentUser,
} from "@/features/jobs/dashboard-queries";
import { statusLabels, type ApplicationStatus } from "@/features/jobs/status";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

const statusClasses: Record<ApplicationStatus, string> = {
  SAVED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  APPLIED: "bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
  INTERVIEWING: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  OFFER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
  ARCHIVED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default async function DashboardPage() {
  const summary: DashboardSummary = await getDashboardSummaryForCurrentUser();
  const todayFocus = summary.todayFocus;

  return (
    <div className="space-y-8 lg:space-y-10">
      <h1 className="sr-only">Dashboard</h1>

      <DashboardFocusSummary focus={todayFocus} />

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ApplicationPipeline
            activeTotal={summary.activeTotal}
            statusCounts={summary.statusCounts}
          />
        </div>

        <section aria-labelledby="upcoming-dates-heading" className="rounded-2xl bg-slate-100/60 p-5 dark:bg-slate-900/45">
          <div>
            <h2 id="upcoming-dates-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upcoming Dates</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Deadlines and follow-ups.</p>
          </div>
          {summary.upcomingJobs.length > 0 ? (
            <div className="mt-4 divide-y divide-slate-200/80 dark:divide-slate-800">
              {summary.upcomingJobs.map((job) => {
                const date = job.deadline ?? job.followUpAt;
                const label = job.deadline ? "Deadline" : "Follow-up";

                return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-md py-3 transition-colors first:pt-0 last:pb-0 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:hover:bg-slate-800/70 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950"
                >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {job.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
                    {date ? (
                      <p className="mt-2 text-xs font-medium text-sky-700 dark:text-sky-300">
                        {label} {formatDate(date)}
                      </p>
                    ) : null}
                </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">No upcoming dates.</p>
          )}
        </section>
      </section>

      <section aria-labelledby="recent-jobs-heading">
        <div>
          <h2 id="recent-jobs-heading" className="text-base font-semibold tracking-tight text-slate-950 dark:text-slate-100">Recent Jobs</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest active roles.</p>
        </div>
        <div className="mt-4 divide-y divide-slate-200/90 dark:divide-slate-800">
          {summary.recentJobs.length > 0 ? (
            summary.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-md py-4 transition-colors first:pt-0 last:pb-0 hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:hover:bg-slate-900/70 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {job.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {job.company}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 sm:items-end">
                      <span className={["inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium", statusClasses[job.status]].join(" ")}>
                        {statusLabels[job.status]}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Saved {formatDate(job.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 py-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">No active jobs yet. Add your first role to start tracking your search.</p>
              <LinkButton href="/jobs/new">Add job</LinkButton>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
