import Link from "next/link";

import { EmptyState } from "@/components/empty-states/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { JobList } from "@/features/jobs/components/job-list";
import {
  buildJobsQueryString,
  normalizeJobsSearchParams,
} from "@/features/jobs/list-params";
import { getJobsForCurrentUser } from "@/features/jobs/queries";
import { statusLabels } from "@/features/jobs/status";

type JobsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    q?: string | string[];
    remoteType?: string | string[];
    employmentType?: string | string[];
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
      status: normalizedParams.status,
      remoteType: normalizedParams.remoteType,
      employmentType: normalizedParams.employmentType,
      sort: normalizedParams.sort,
    },
  );
  const hasAnyActiveFilters = Boolean(
    normalizedParams.q ||
      normalizedParams.status ||
      normalizedParams.remoteType ||
      normalizedParams.employmentType ||
      normalizedParams.sort !== "newest",
  );
  const hasExportableJobs = jobs.length > 0;
  const exportUnavailableMessage = "Add at least one job to export";
  const clearFiltersHref = `/jobs${buildJobsQueryString(normalizedParams, {
    q: "",
    status: null,
    remoteType: null,
    employmentType: null,
    sort: "newest",
  })}`;
  const activeViewHref = `/jobs${buildJobsQueryString(normalizedParams, {
    view: "active",
    status: normalizedParams.status === "ARCHIVED" ? null : normalizedParams.status,
  })}`;
  const archivedViewHref = `/jobs${buildJobsQueryString(normalizedParams, {
    view: "archived",
    status: null,
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
            <LinkButton
              href={
                isArchivedView
                  ? "/jobs/export?status=archived"
                  : "/jobs/export?status=active"
              }
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

      <form
        method="GET"
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
      >
        {isArchivedView ? (
          <input type="hidden" name="status" value="archived" />
        ) : null}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label htmlFor="q" className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Search company or title
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={normalizedParams.q}
              placeholder="e.g. Stripe, Product Manager"
            />
          </div>

          <div>
            <label htmlFor="status-filter" className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Status
            </label>
            <select
              id="status-filter"
              name="status"
              defaultValue={
                isArchivedView ? "archived" : (normalizedParams.status ?? "")
              }
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            >
              {isArchivedView ? <option value="archived">Archived</option> : <option value="">All active statuses</option>}
              {!isArchivedView ? (
                <>
                  <option value="SAVED">{statusLabels.SAVED}</option>
                  <option value="APPLIED">{statusLabels.APPLIED}</option>
                  <option value="INTERVIEWING">{statusLabels.INTERVIEWING}</option>
                  <option value="OFFER">{statusLabels.OFFER}</option>
                  <option value="REJECTED">{statusLabels.REJECTED}</option>
                </>
              ) : null}
            </select>
          </div>

          <div>
            <label htmlFor="remoteType" className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Remote type
            </label>
            <select
              id="remoteType"
              name="remoteType"
              defaultValue={normalizedParams.remoteType ?? ""}
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            >
              <option value="">All remote types</option>
              <option value="ONSITE">Onsite</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </select>
          </div>

          <div>
            <label htmlFor="employmentType" className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Employment type
            </label>
            <select
              id="employmentType"
              name="employmentType"
              defaultValue={normalizedParams.employmentType ?? ""}
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            >
              <option value="">All employment types</option>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="TEMPORARY">Temporary</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="sm:max-w-xs">
            <label htmlFor="sort" className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Sort
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={normalizedParams.sort}
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            >
              <option value="newest">Newest</option>
              <option value="deadlineSoonest">Deadline soonest</option>
              <option value="followUpSoonest">Follow-up soonest</option>
            </select>
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Apply filters
          </Button>
          {hasAnyActiveFilters ? (
            <LinkButton href={clearFiltersHref} variant="ghost" className="w-full sm:w-auto">
              Clear filters
            </LinkButton>
          ) : null}
        </div>
      </form>

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
