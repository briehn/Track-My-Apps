import { EmptyState } from "@/components/empty-states/empty-state";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { JobsControlsToolbar } from "@/features/jobs/components/jobs-controls-toolbar";
import { JobList } from "@/features/jobs/components/job-list";
import { JobsTable } from "@/features/jobs/components/jobs-table";
import {
  buildJobsQueryString,
  normalizeJobsLayoutParam,
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
    layout?: string | string[];
    sort?: string | string[];
  }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const normalizedParams = normalizeJobsSearchParams(params);
  const selectedLayout = normalizeJobsLayoutParam(params);
  const isTableLayout = selectedLayout === "table";
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
  }, { layout: selectedLayout })}`;
  const archivedViewHref = `/jobs${buildJobsQueryString(normalizedParams, {
    view: "archived",
    statuses: [],
  }, { layout: selectedLayout })}`;
  const cardsViewHref = `/jobs${buildJobsQueryString(normalizedParams, undefined, {
    layout: "cards",
  })}`;
  const tableViewHref = `/jobs${buildJobsQueryString(normalizedParams, undefined, {
    layout: "table",
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
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-100">Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isArchivedView
              ? "Archived roles."
              : "Track and organize your applications."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900"
            aria-label="Import and export jobs"
          >
            <LinkButton href="/jobs/import" variant="ghost" className="px-3 py-1.5">
              Import
            </LinkButton>
            <span aria-hidden="true" className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            {hasExportableJobs ? (
              <>
                <LinkButton href={csvExportHref} variant="ghost" className="px-3 py-1.5">
                  CSV
                </LinkButton>
                <LinkButton href={xlsxExportHref} variant="ghost" className="px-3 py-1.5">
                  XLSX
                </LinkButton>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  title={exportUnavailableMessage}
                  aria-label={`Export CSV unavailable. ${exportUnavailableMessage}.`}
                >
                  CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  title={exportUnavailableMessage}
                  aria-label={`Export XLSX unavailable. ${exportUnavailableMessage}.`}
                >
                  XLSX
                </Button>
              </>
            )}
          </div>
          <LinkButton href="/jobs/new">
            Add job
          </LinkButton>
        </div>
      </div>

      <JobsControlsToolbar
        activeViewHref={activeViewHref}
        archivedViewHref={archivedViewHref}
        cardsViewHref={cardsViewHref}
        employmentTypes={normalizedParams.employmentTypes}
        hasAnyActiveFilters={hasAnyActiveFilters}
        isArchivedView={isArchivedView}
        panelId="secondary-filters-panel"
        q={normalizedParams.q}
        remoteTypes={normalizedParams.remoteTypes}
        selectedLayout={selectedLayout}
        secondaryFiltersActive={Boolean(
          normalizedParams.statuses.length > 0 ||
            normalizedParams.remoteTypes.length > 0 ||
            normalizedParams.employmentTypes.length > 0,
        )}
        sort={normalizedParams.sort}
        statuses={normalizedParams.statuses}
        tableViewHref={tableViewHref}
      />

      {jobs.length > 0 ? (
        isTableLayout ? (
          <>
            <div className="md:hidden">
              <JobList jobs={jobs} />
            </div>
            <div className="hidden md:block">
              <JobsTable jobs={jobs} />
            </div>
          </>
        ) : (
          <JobList jobs={jobs} />
        )
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
