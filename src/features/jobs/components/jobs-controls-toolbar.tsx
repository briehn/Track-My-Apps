"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { JobsFilterToolbar } from "@/features/jobs/components/jobs-filter-toolbar";
import type {
  JobListLayout,
  JobListSort,
} from "@/features/jobs/list-params";
import type {
  ApplicationStatus,
  EmploymentType,
  RemoteType,
} from "@prisma/client";

type JobsControlsToolbarProps = {
  activeViewHref: string;
  archivedViewHref: string;
  cardsViewHref: string;
  employmentTypes: EmploymentType[];
  hasAnyActiveFilters: boolean;
  isArchivedView: boolean;
  panelId?: string;
  q: string;
  remoteTypes: RemoteType[];
  secondaryFiltersActive: boolean;
  selectedLayout: JobListLayout;
  sort: JobListSort;
  statuses: ApplicationStatus[];
  tableViewHref: string;
};

export function JobsControlsToolbar({
  activeViewHref,
  archivedViewHref,
  cardsViewHref,
  employmentTypes,
  hasAnyActiveFilters,
  isArchivedView,
  panelId = "secondary-filters-panel",
  q,
  remoteTypes,
  secondaryFiltersActive,
  selectedLayout,
  sort,
  statuses,
  tableViewHref,
}: JobsControlsToolbarProps) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(secondaryFiltersActive);
  const isTableLayout = selectedLayout === "table";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="inline-flex w-fit flex-wrap gap-2 p-1" aria-label="Job list views">
          <Link
            href={activeViewHref}
            aria-current={!isArchivedView ? "page" : undefined}
            className={[
              "rounded-md px-3 py-2 text-sm font-medium transition",
              !isArchivedView
                ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
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
                ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
            ].join(" ")}
          >
            Archived
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="hidden w-fit rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 md:inline-flex"
            aria-label="Jobs layout toggle"
          >
            <Link
              href={cardsViewHref}
              aria-current={!isTableLayout ? "page" : undefined}
              className={[
                "rounded-md px-3 py-2 text-sm font-medium transition",
                !isTableLayout
                  ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              ].join(" ")}
            >
              Cards
            </Link>
            <Link
              href={tableViewHref}
              aria-current={isTableLayout ? "page" : undefined}
              className={[
                "rounded-md px-3 py-2 text-sm font-medium transition",
                isTableLayout
                  ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              ].join(" ")}
            >
              Table
            </Link>
          </div>

          {isTableLayout ? (
            <p className="text-xs text-slate-600 dark:text-slate-300 md:hidden" role="status">
              Table view is shown on larger screens. Cards are shown on mobile.
            </p>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            aria-expanded={isFiltersExpanded}
            aria-controls={panelId}
            className={
              hasAnyActiveFilters
                ? "border-slate-400 bg-slate-100 text-slate-900 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100"
                : undefined
            }
            onClick={() => setIsFiltersExpanded((previous) => !previous)}
          >
            Filters
          </Button>
        </div>
      </div>

      <JobsFilterToolbar
        employmentTypes={employmentTypes}
        hasAnyActiveFilters={hasAnyActiveFilters}
        isArchivedView={isArchivedView}
        isExpanded={isFiltersExpanded}
        panelId={panelId}
        q={q}
        remoteTypes={remoteTypes}
        secondaryFiltersActive={secondaryFiltersActive}
        selectedLayout={selectedLayout}
        sort={sort}
        statuses={statuses}
      />
    </div>
  );
}
