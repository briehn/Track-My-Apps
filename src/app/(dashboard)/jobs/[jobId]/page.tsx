import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { JobAnalysisCard } from "@/features/job-analysis/components/job-analysis-card";
import {
  hasAnalyzableJobDescription,
  isJobDescriptionTooLong,
} from "@/features/job-analysis/schemas";
import { isJobAnalysisStale } from "@/features/job-analysis/staleness";
import { JobMatchCard } from "@/features/job-match/components/job-match-card";
import { InterviewPrepCard } from "@/features/interview-prep/components/interview-prep-card";
import { JobManagementActions } from "@/features/jobs/components/job-management-actions";
import { AIInsightsPanel } from "@/features/jobs/components/ai-insights-panel";
import { JobStatusForm } from "@/features/jobs/components/job-status-form";
import { getJobForCurrentUser, type JobDetail } from "@/features/jobs/queries";
import { statusBadgeVariants, statusLabels } from "@/features/jobs/status";
import { NoteForm } from "@/features/notes/components/note-form";
import { NotesList } from "@/features/notes/components/notes-list";
import { getNotesForJobForCurrentUser } from "@/features/notes/queries";
import { getProfileForCurrentUser } from "@/features/profiles/queries";
import { isSafeExternalUrl } from "@/lib/url";

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
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
        {value}
      </dd>
    </div>
  );
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;
  const [job, notes, profile] = await Promise.all([
    getJobForCurrentUser(jobId),
    getNotesForJobForCurrentUser(jobId),
    getProfileForCurrentUser(),
  ]);

  if (!job) {
    notFound();
  }

  const safeJobUrl = job.url && isSafeExternalUrl(job.url) ? job.url : null;
  const hasJobAnalysis = Boolean(job.analysis);
  const isAnalysisStale = isJobAnalysisStale(job.updatedAt, job.analysis?.updatedAt);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-4">
        <Link
          href="/jobs"
          className="group inline-flex items-center gap-1 rounded-md px-1 py-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-slate-100 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950"
        >
          <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          Back to Jobs
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {job.company}
              </p>
              <Badge variant={statusBadgeVariants[job.status]}>
                {statusLabels[job.status]}
              </Badge>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              {job.title}
            </h1>
          </div>
          <LinkButton href={`/jobs/${job.id}/edit`} variant="secondary">
            Edit job
          </LinkButton>
        </div>
      </div>

      <Card className="gap-0">
        <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
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
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Job URL
                </dt>
                <dd className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {safeJobUrl ? (
                    <a
                      href={safeJobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-slate-950 underline underline-offset-4 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 dark:text-slate-100 dark:hover:text-slate-300 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950"
                    >
                      Open posting
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-7 space-y-3 border-t border-slate-200/80 pt-6 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                Job Description
              </h2>
              {job.description ? (
                <div className="max-h-80 overflow-auto rounded-xl bg-slate-100/70 p-4 dark:bg-slate-900/60">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
                    {job.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Not provided
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-5 rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900/60">
            <JobStatusForm jobId={job.id} currentStatus={job.status} />
            <dl className="grid gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-800">
              <DetailItem label="Saved" value={formatDate(job.createdAt)} />
              <DetailItem label="Updated" value={formatDate(job.updatedAt)} />
              <DetailItem label="Deadline" value={formatDate(job.deadline)} />
              <DetailItem label="Applied" value={formatDate(job.appliedAt)} />
              <DetailItem label="Follow-up" value={formatDate(job.followUpAt)} />
            </dl>
          </aside>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Run job analysis and profile matching without letting AI details dominate the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIInsightsPanel
                analysisContent={
                  <JobAnalysisCard
                    analysis={job.analysis}
                    hasAnalyzableDescription={hasAnalyzableJobDescription(job.description)}
                    isDescriptionTooLong={
                      job.description ? isJobDescriptionTooLong(job.description) : false
                    }
                    isStale={isAnalysisStale}
                    descriptionLength={job.description?.length ?? 0}
                    jobId={job.id}
                  />
                }
                matchContent={
                  <JobMatchCard
                    hasJobAnalysis={hasJobAnalysis}
                    hasProfile={Boolean(profile)}
                    hasResumeText={Boolean(profile?.resumeText?.trim())}
                    isJobAnalysisStale={isAnalysisStale}
                    jobId={job.id}
                  />
                }
                prepContent={
                  <InterviewPrepCard
                    hasJobAnalysis={hasJobAnalysis}
                    hasProfile={Boolean(profile)}
                    hasResumeText={Boolean(profile?.resumeText?.trim())}
                    isJobAnalysisStale={isAnalysisStale}
                    jobId={job.id}
                  />
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Capture recruiter updates, interview notes, and decision context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <NoteForm jobId={job.id} />
              {notes.length > 0 ? (
                <NotesList jobId={job.id} notes={notes} />
              ) : (
                <div className="rounded-xl bg-slate-100/70 p-6 text-center dark:bg-slate-900/60">
                  <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
                    No notes yet
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Add the first note to keep context with this job.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Job</CardTitle>
              <CardDescription>
                Archive this role or permanently remove it from your tracker.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobManagementActions
                jobId={job.id}
                isArchived={job.status === "ARCHIVED"}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
