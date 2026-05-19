import Link from "next/link";

import { EmptyState } from "@/components/empty-states/empty-state";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { JobsFilterToolbar } from "@/features/jobs/components/jobs-filter-toolbar";
import { JobList } from "@/features/jobs/components/job-list";
import {
  buildJobsQueryString,
  normalizeJobsSearchParams,
} from "@/features/jobs/list-params";
import { getJobsForCurrentUser } from "@/features/jobs/queries";

type JobsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    statuses?: string | string[];
    q?: string | string[];
    remoteType?: string | string[];
    remoteTypes?: string | string[];
    employmentType?: string | string[];
    employmentTypes?: string | string[];
    sort?: string | string[];
  }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const normalizedParams = normalizeJobsSearchParams(params);
  const isArchivedView = normalizedParams.view === "archived";
  const jobs = await getJobsForCurrentUser(
    isArchivedView ? "archived" : "active",
    {
      q: normalizedParams.q,
      statuses: normalizedParams.statuses,
      remoteTypes: normalizedParams.remoteTypes,
      employmentTypes: normalizedParams.employmentTypes,
      sort: normalizedParams.sort,
    },
  );
  const hasAnyActiveFilters = Boolean(
    normalizedParams.q ||
      normalizedParams.statuses.length > 0 ||
      normalizedParams.remoteTypes.length > 0 ||
      normalizedParams.employmentTypes.length > 0 ||
      normalizedParams.sort !== "newest",
  );
  const hasExportableJobs = jobs.length > 0;
  const exportUnavailableMessage = "Add at least one job to export";
  const csvExportHref = isArchivedView
    ? "/jobs/export?status=archived"
    : "/jobs/export?status=active";
  const xlsxExportHref = `/jobs/export/xlsx${buildJobsQueryString(normalizedParams)}`;
  const activeViewHref = `/jobs${buildJobsQueryString(normalizedParams, {
    view: "active",
    statuses: normalizedParams.statuses.filter((statusValue) => statusValue !== "ARCHIVED"),
  })}`;
  const archivedViewHref = `/jobs${buildJobsQueryString(normalizedParams, {
    view: "archived",
    statuses: [],
  })}`;
  const hasAppliedFiltersWithNoResults = hasAnyActiveFilters && jobs.length === 0;
  const emptyTitle = hasAppliedFiltersWithNoResults
    ? "No jobs match these filters"
    : isArchivedView
      ? "No archived jobs"
      : "No active jobs yet";
  const emptyDescription = hasAppliedFiltersWithNoResults
    ? "Try broadening your search or clearing filters to see more saved jobs."
    : isArchivedView
      ? "Archived jobs will appear here after you move them out of your active workflow."
      : "Start by manually saving a role. Archived jobs are kept separate from this active list.";

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
            <>
              <LinkButton href={csvExportHref} variant="secondary">
                Export CSV
              </LinkButton>
              <LinkButton href={xlsxExportHref} variant="secondary">
                Export XLSX
              </LinkButton>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                disabled
                title={exportUnavailableMessage}
                aria-label={`Export CSV unavailable. ${exportUnavailableMessage}.`}
              >
                Export CSV
              </Button>
              <Button
                variant="secondary"
                disabled
                title={exportUnavailableMessage}
                aria-label={`Export XLSX unavailable. ${exportUnavailableMessage}.`}
              >
                Export XLSX
              </Button>
            </>
          )}
          <LinkButton href="/jobs/new">
            Add job
          </LinkButton>
        </div>
      </div>

      <div className="inline-flex w-fit flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1" aria-label="Job list views">
        <Link
          href={activeViewHref}
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
          href={archivedViewHref}
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

      <JobsFilterToolbar
        key={normalizedParams.view}
        employmentTypes={normalizedParams.employmentTypes}
        hasAnyActiveFilters={hasAnyActiveFilters}
        isArchivedView={isArchivedView}
        q={normalizedParams.q}
        remoteTypes={normalizedParams.remoteTypes}
        secondaryFiltersActive={Boolean(
          normalizedParams.statuses.length > 0 ||
            normalizedParams.remoteTypes.length > 0 ||
            normalizedParams.employmentTypes.length > 0,
        )}
        sort={normalizedParams.sort}
        statuses={normalizedParams.statuses}
      />

      {jobs.length > 0 ? (
        <JobList jobs={jobs} />
      ) : (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            isArchivedView || hasAppliedFiltersWithNoResults ? null : (
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
