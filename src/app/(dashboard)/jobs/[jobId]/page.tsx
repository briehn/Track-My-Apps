import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JobStatusForm } from "@/features/jobs/components/job-status-form";
import { getJobForCurrentUser, type JobDetail } from "@/features/jobs/queries";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

const statusLabels: Record<JobDetail["status"], string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
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
      <dt className="text-sm font-medium text-slate-950">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-600">{value}</dd>
    </div>
  );
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;
  const job = await getJobForCurrentUser(jobId);

  if (!job) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/jobs"
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        Back to jobs
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            {job.company}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {job.title}
          </h1>
        </div>
        <Badge>{statusLabels[job.status]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Job details</CardTitle>
            <CardDescription>
              Saved posting metadata for this opportunity.
            </CardDescription>
          </CardHeader>

          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Location"
              value={job.location ?? "Not provided"}
            />
            <DetailItem
              label="Work mode"
              value={
                job.remoteType ? remoteTypeLabels[job.remoteType] : "Not provided"
              }
            />
            <DetailItem
              label="Employment type"
              value={
                job.employmentType
                  ? employmentTypeLabels[job.employmentType]
                  : "Not provided"
              }
            />
            <DetailItem label="Salary" value={formatSalary(job)} />
            <DetailItem label="Source" value={job.source ?? "Not provided"} />
            <div>
              <dt className="text-sm font-medium text-slate-950">Job URL</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">
                {job.url ? (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-slate-950 underline underline-offset-4 hover:text-slate-700"
                  >
                    {job.url}
                  </a>
                ) : (
                  "Not provided"
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Move this job through your application workflow.
              </CardDescription>
            </CardHeader>
            <JobStatusForm jobId={job.id} currentStatus={job.status} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
              <CardDescription>Timeline fields for this role.</CardDescription>
            </CardHeader>
            <dl className="space-y-5">
              <DetailItem label="Saved" value={formatDate(job.createdAt)} />
              <DetailItem label="Updated" value={formatDate(job.updatedAt)} />
              <DetailItem label="Deadline" value={formatDate(job.deadline)} />
              <DetailItem label="Applied" value={formatDate(job.appliedAt)} />
              <DetailItem label="Follow-up" value={formatDate(job.followUpAt)} />
            </dl>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>The saved job description text.</CardDescription>
        </CardHeader>
        {job.description ? (
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {job.description}
          </p>
        ) : (
          <p className="text-sm text-slate-600">Not provided</p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes and analysis</CardTitle>
          <CardDescription>
            Notes and structured analysis will be added in later milestones.
          </CardDescription>
        </CardHeader>
        <p className="text-sm text-slate-600">Not implemented yet.</p>
      </Card>
    </div>
  );
}
