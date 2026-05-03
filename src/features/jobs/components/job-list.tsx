import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { JobListItem } from "@/features/jobs/queries";

type JobListProps = {
  jobs: JobListItem[];
};

const statusLabels: Record<JobListItem["status"], string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

const remoteTypeLabels: Record<NonNullable<JobListItem["remoteType"]>, string> =
  {
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
    <div className="grid gap-4">
      {jobs.map((job) => {
        const metadata = [
          job.location,
          job.remoteType ? remoteTypeLabels[job.remoteType] : null,
        ].filter(Boolean);

        return (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="block rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <Card className="transition hover:border-slate-300 hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <CardHeader className="mb-0">
                  <CardTitle>{job.title}</CardTitle>
                  <CardDescription>{job.company}</CardDescription>
                  {metadata.length > 0 ? (
                    <p className="text-sm text-slate-500">
                      {metadata.join(" - ")}
                    </p>
                  ) : null}
                </CardHeader>

                <div className="flex flex-col gap-2 sm:items-end">
                  <Badge>{statusLabels[job.status]}</Badge>
                  <p className="text-sm text-slate-500">
                    {job.deadline
                      ? `Deadline ${formatDate(job.deadline)}`
                      : `Saved ${formatDate(job.createdAt)}`}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
