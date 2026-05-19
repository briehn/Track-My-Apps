import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { JobListItem } from "@/features/jobs/queries";
import { statusBadgeVariants, statusLabels } from "@/features/jobs/status";

type JobsTableProps = {
  jobs: JobListItem[];
};

const remoteTypeLabels: Record<NonNullable<JobListItem["remoteType"]>, string> = {
  ONSITE: "Onsite",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

const employmentTypeLabels: Record<NonNullable<JobListItem["employmentType"]>, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value: Date | null) {
  return value ? dateFormatter.format(value) : "—";
}

export function JobsTable({ jobs }: JobsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <table className="min-w-[920px] w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            <th className="px-3 py-3 font-semibold">Company</th>
            <th className="px-3 py-3 font-semibold">Title</th>
            <th className="px-3 py-3 font-semibold">Status</th>
            <th className="px-3 py-3 font-semibold">Remote</th>
            <th className="px-3 py-3 font-semibold">Employment</th>
            <th className="px-3 py-3 font-semibold">Deadline</th>
            <th className="px-3 py-3 font-semibold">Follow-up</th>
            <th className="px-3 py-3 font-semibold">Saved</th>
            <th className="px-3 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-b border-slate-100 text-sm last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
            >
              <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">
                {job.company}
              </td>
              <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{job.title}</td>
              <td className="px-3 py-3">
                <Badge variant={statusBadgeVariants[job.status]}>
                  {statusLabels[job.status]}
                </Badge>
              </td>
              <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                {job.remoteType ? remoteTypeLabels[job.remoteType] : "—"}
              </td>
              <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                {job.employmentType ? employmentTypeLabels[job.employmentType] : "—"}
              </td>
              <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                {formatDate(job.deadline)}
              </td>
              <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                {formatDate(job.followUpAt)}
              </td>
              <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                {formatDate(job.createdAt)}
              </td>
              <td className="px-3 py-3">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-sm font-medium text-slate-900 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:text-slate-100"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

