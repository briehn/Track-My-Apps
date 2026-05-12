import Link from "next/link";

import { EmptyState } from "@/components/empty-states/empty-state";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { JobList } from "@/features/jobs/components/job-list";
import { getJobsForCurrentUser } from "@/features/jobs/queries";

type JobsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const { status } = await searchParams;
  const isArchivedView = status === "archived";
  const jobs = await getJobsForCurrentUser(
    isArchivedView ? "archived" : "active",
  );
  const hasExportableJobs = jobs.length > 0;
  const exportUnavailableMessage = "Add at least one job to export";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Job tracker
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isArchivedView
              ? "Review jobs you have moved out of your active workflow."
              : "View active roles you have manually saved."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/jobs/import" variant="secondary">
            Import jobs
          </LinkButton>
          {hasExportableJobs ? (
            <LinkButton
              href={isArchivedView ? "/jobs/export?status=archived" : "/jobs/export?status=active"}
              variant="secondary"
            >
              Export CSV
            </LinkButton>
          ) : (
            <Button
              variant="secondary"
              disabled
              title={exportUnavailableMessage}
              aria-label={`Export CSV unavailable. ${exportUnavailableMessage}.`}
            >
              Export CSV
            </Button>
          )}
          <LinkButton href="/jobs/new">
            Add job
          </LinkButton>
        </div>
      </div>

      <div className="inline-flex w-fit flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1" aria-label="Job list views">
        <Link
          href="/jobs"
          aria-current={!isArchivedView ? "page" : undefined}
          className={[
            "rounded-md px-3 py-2 text-sm font-medium transition",
            !isArchivedView
              ? "bg-slate-950 text-white"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
          ].join(" ")}
        >
          Active
        </Link>
        <Link
          href="/jobs?status=archived"
          aria-current={isArchivedView ? "page" : undefined}
          className={[
            "rounded-md px-3 py-2 text-sm font-medium transition",
            isArchivedView
              ? "bg-slate-950 text-white"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
          ].join(" ")}
        >
          Archived
        </Link>
      </div>

      {jobs.length > 0 ? (
        <JobList jobs={jobs} />
      ) : (
        <EmptyState
          title={isArchivedView ? "No archived jobs" : "No active jobs yet"}
          description={
            isArchivedView
              ? "Archived jobs will appear here after you move them out of your active workflow."
              : "Start by manually saving a role. Archived jobs are kept separate from this active list."
          }
          action={
            isArchivedView ? null : (
              <LinkButton href="/jobs/new">
                Add job
              </LinkButton>
            )
          }
        />
      )}
    </div>
  );
}
