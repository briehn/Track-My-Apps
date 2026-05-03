import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { JobManagementActions } from "@/features/jobs/components/job-management-actions";
import { JobStatusForm } from "@/features/jobs/components/job-status-form";
import { getJobForCurrentUser, type JobDetail } from "@/features/jobs/queries";
import { statusBadgeVariants, statusLabels } from "@/features/jobs/status";
import { NoteForm } from "@/features/notes/components/note-form";
import { NotesList } from "@/features/notes/components/notes-list";
import { getNotesForJobForCurrentUser } from "@/features/notes/queries";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

const remoteTypeLabels: Record<NonNullable<JobDetail["remoteType"]>, string> = {
  ONSITE: "Onsite",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

const employmentTypeLabels: Record<
  NonNullable<JobDetail["employmentType"]>,
  string
> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Not provided";
}

function formatSalary(job: JobDetail) {
  const currency = job.salaryCurrency ?? "USD";

  if (job.salaryMin !== null && job.salaryMax !== null) {
    return `${currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
  }

  if (job.salaryMin !== null) {
    return `${currency} ${job.salaryMin.toLocaleString()}+`;
  }

  if (job.salaryMax !== null) {
    return `Up to ${currency} ${job.salaryMax.toLocaleString()}`;
  }

  return "Not provided";
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd>
    </div>
  );
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;
  const [job, notes] = await Promise.all([
    getJobForCurrentUser(jobId),
    getNotesForJobForCurrentUser(jobId),
  ]);

  if (!job) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/jobs"
          className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          Back to jobs
        </Link>
        <LinkButton href={`/jobs/${job.id}/edit`} variant="secondary">
          Edit job
        </LinkButton>
      </div>

      <Card>
        <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                {job.company}
              </p>
              <Badge variant={statusBadgeVariants[job.status]}>
                {statusLabels[job.status]}
              </Badge>
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {job.title}
            </h1>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Location" value={job.location ?? "Not provided"} />
              <DetailItem
                label="Work mode"
                value={job.remoteType ? remoteTypeLabels[job.remoteType] : "Not provided"}
              />
              <DetailItem
                label="Employment"
                value={
                  job.employmentType
                    ? employmentTypeLabels[job.employmentType]
                    : "Not provided"
                }
              />
              <DetailItem label="Salary" value={formatSalary(job)} />
              <DetailItem label="Source" value={job.source ?? "Not provided"} />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Job URL
                </dt>
                <dd className="mt-1 text-sm leading-6 text-slate-700">
                  {job.url ? (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-slate-950 underline underline-offset-4 hover:text-slate-700"
                    >
                      Open posting
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
            <JobStatusForm jobId={job.id} currentStatus={job.status} />
            <dl className="grid gap-3 border-t border-slate-200 pt-4">
              <DetailItem label="Saved" value={formatDate(job.createdAt)} />
              <DetailItem label="Updated" value={formatDate(job.updatedAt)} />
              <DetailItem label="Deadline" value={formatDate(job.deadline)} />
              <DetailItem label="Applied" value={formatDate(job.appliedAt)} />
              <DetailItem label="Follow-up" value={formatDate(job.followUpAt)} />
            </dl>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <CardDescription>The saved job description text.</CardDescription>
            </CardHeader>
            {job.description ? (
              <div className="max-h-[32rem] overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {job.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Not provided</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Capture recruiter updates, interview notes, and decision context.
              </CardDescription>
            </CardHeader>
            <div className="space-y-5">
              <NoteForm jobId={job.id} />
              {notes.length > 0 ? (
                <NotesList jobId={job.id} notes={notes} />
              ) : (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm font-medium text-slate-950">
                    No notes yet
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Add the first note to keep context with this job.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Manage job</CardTitle>
              <CardDescription>
                Archive this role or permanently remove it from your tracker.
              </CardDescription>
            </CardHeader>
            <JobManagementActions
              jobId={job.id}
              isArchived={job.status === "ARCHIVED"}
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analysis</CardTitle>
              <CardDescription>
                Structured job analysis will be added in a later milestone.
              </CardDescription>
            </CardHeader>
            <p className="text-sm text-slate-600">Not implemented yet.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
