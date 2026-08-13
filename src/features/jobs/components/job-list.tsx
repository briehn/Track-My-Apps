import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { JobQuickActions } from "@/features/jobs/components/job-quick-actions";
import type { JobListItem } from "@/features/jobs/queries";
import { statusBadgeVariants, statusLabels } from "@/features/jobs/status";

type JobListProps = {
  jobs: JobListItem[];
};

const remoteTypeLabels: Record<NonNullable<JobListItem["remoteType"]>, string> = {
  ONSITE: "Onsite",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export function JobList({ jobs }: JobListProps) {
  return (
    <div className="grid gap-2.5">
      {jobs.map((job) => {
        const metadata = [
          job.location,
          job.remoteType ? remoteTypeLabels[job.remoteType] : null,
        ].filter(Boolean);

        return (
          <article
            key={job.id}
            className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-950/5 transition-[background-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:bg-slate-50 hover:shadow-md dark:bg-slate-900 dark:ring-white/10 dark:hover:bg-slate-800/80"
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5">
              <Link
                href={`/jobs/${job.id}`}
                aria-label={`View ${job.title} at ${job.company}`}
                className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950"
              >
                <div>
                  <p className="truncate text-base font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                    {job.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">
                    {job.company}
                  </p>
                  {metadata.length > 0 ? (
                    <p className="mt-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {metadata.join(" · ")}
                    </p>
                  ) : null}
                </div>
              </Link>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 sm:justify-end">
                <Badge variant={statusBadgeVariants[job.status]}>
                  {statusLabels[job.status]}
                </Badge>
                <span aria-hidden="true" className="hidden h-3 w-px bg-slate-300 sm:block dark:bg-slate-700" />
                <p>
                  {job.deadline
                    ? `Deadline ${formatDate(job.deadline)}`
                    : `Saved ${formatDate(job.createdAt)}`}
                </p>
                <JobQuickActions job={job} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
