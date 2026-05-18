"use client";

import type { ApplicationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JobListSort } from "@/features/jobs/list-params";
import { APPLICATION_STATUSES } from "@/features/jobs/status";
import { statusLabels } from "@/features/jobs/status";

type JobsFilterToolbarProps = {
  clearFiltersHref: string;
  employmentTypes: string[];
  hasAnyActiveFilters: boolean;
  isArchivedView: boolean;
  q: string;
  remoteTypes: string[];
  secondaryFiltersActive: boolean;
  sort: JobListSort;
  statuses: ApplicationStatus[];
};

function formatEmploymentTypeLabel(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0)}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function formatRemoteTypeLabel(value: string) {
  return `${value.charAt(0)}${value.slice(1).toLowerCase()}`;
}

export function JobsFilterToolbar({
  clearFiltersHref,
  employmentTypes,
  hasAnyActiveFilters,
  isArchivedView,
  q,
  remoteTypes,
  secondaryFiltersActive,
  sort,
  statuses,
}: JobsFilterToolbarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(secondaryFiltersActive);
  const [selectedStatuses, setSelectedStatuses] = useState<ApplicationStatus[]>(
    statuses,
  );
  const [selectedRemoteTypes, setSelectedRemoteTypes] = useState<string[]>(
    remoteTypes,
  );
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>(
    employmentTypes,
  );
  const normalizedStatuses: ApplicationStatus[] = isArchivedView
    ? ["ARCHIVED"]
    : APPLICATION_STATUSES.filter((statusValue) => statusValue !== "ARCHIVED");
  const isStatusChecked = (statusValue: ApplicationStatus) =>
    isArchivedView
      ? statusValue === "ARCHIVED"
      : selectedStatuses.includes(statusValue);
  const isRemoteTypeChecked = (remoteTypeValue: string) =>
    selectedRemoteTypes.includes(remoteTypeValue);
  const isEmploymentTypeChecked = (employmentTypeValue: string) =>
    selectedEmploymentTypes.includes(employmentTypeValue);

  function toggleStringSelection<T extends string>(
    values: T[],
    value: T,
    checked: boolean,
  ): T[] {
    if (checked) {
      return values.includes(value) ? values : [...values, value];
    }

    return values.filter((currentValue) => currentValue !== value);
  }

  function toSortedString(values: string[]) {
    return [...values].sort().join(",");
  }

  const draftDiffersFromApplied =
    toSortedString(selectedStatuses) !== toSortedString(statuses) ||
    toSortedString(selectedRemoteTypes) !== toSortedString(remoteTypes) ||
    toSortedString(selectedEmploymentTypes) !== toSortedString(employmentTypes);
  const hasDraftSelections =
    selectedStatuses.length > 0 ||
    selectedRemoteTypes.length > 0 ||
    selectedEmploymentTypes.length > 0;
  const canClearFilters =
    hasAnyActiveFilters || hasDraftSelections || draftDiffersFromApplied;

  return (
    <form
      method="GET"
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
    >
      {isArchivedView ? <input type="hidden" name="status" value="archived" /> : null}

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_12rem_auto_auto] lg:items-end">
        <div>
          <label htmlFor="q" className="text-sm font-medium text-slate-950 dark:text-slate-100">
            Search company or title
          </label>
          <Input id="q" name="q" defaultValue={q} placeholder="Search jobs" />
        </div>
        <div>
          <label htmlFor="sort" className="text-sm font-medium text-slate-950 dark:text-slate-100">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
          >
            <option value="newest">Newest</option>
            <option value="deadlineSoonest">Deadline soonest</option>
            <option value="followUpSoonest">Follow-up soonest</option>
          </select>
        </div>
        <Button
          type="button"
          variant="secondary"
          aria-expanded={isExpanded}
          aria-controls="secondary-filters-panel"
          className="w-full lg:w-auto"
          onClick={() => {
            setIsExpanded((previous) => !previous);
          }}
        >
          Filters
        </Button>
        <Button type="submit" className="w-full lg:w-auto">
          Apply
        </Button>
      </div>

      {isExpanded ? (
        <div
          id="secondary-filters-panel"
          className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-950 dark:text-slate-100">
                Status
              </legend>
              <div className="space-y-2">
                {normalizedStatuses.map((statusValue) => (
                  <label
                    key={statusValue}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <input
                      type="checkbox"
                      name="statuses"
                      value={statusValue}
                      checked={isStatusChecked(statusValue)}
                      disabled={isArchivedView}
                      onChange={(event) => {
                        if (isArchivedView) {
                          return;
                        }
                        const checked = event.currentTarget.checked;

                        setSelectedStatuses((previous) =>
                          toggleStringSelection(
                            previous,
                            statusValue,
                            checked,
                          ),
                        );
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-500"
                    />
                    {statusLabels[statusValue]}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-950 dark:text-slate-100">
                Remote type
              </legend>
              <div className="space-y-2">
                {["ONSITE", "HYBRID", "REMOTE"].map((remoteTypeValue) => (
                  <label
                    key={remoteTypeValue}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <input
                      type="checkbox"
                      name="remoteTypes"
                      value={remoteTypeValue}
                      checked={isRemoteTypeChecked(remoteTypeValue)}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        setSelectedRemoteTypes((previous) =>
                          toggleStringSelection(
                            previous,
                            remoteTypeValue,
                            checked,
                          ),
                        );
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-500"
                    />
                    {formatRemoteTypeLabel(remoteTypeValue)}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-950 dark:text-slate-100">
                Employment type
              </legend>
              <div className="space-y-2">
                {[
                  "FULL_TIME",
                  "PART_TIME",
                  "CONTRACT",
                  "INTERNSHIP",
                  "TEMPORARY",
                ].map((employmentTypeValue) => (
                  <label
                    key={employmentTypeValue}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <input
                      type="checkbox"
                      name="employmentTypes"
                      value={employmentTypeValue}
                      checked={isEmploymentTypeChecked(employmentTypeValue)}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        setSelectedEmploymentTypes((previous) =>
                          toggleStringSelection(
                            previous,
                            employmentTypeValue,
                            checked,
                          ),
                        );
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-500"
                    />
                    {formatEmploymentTypeLabel(employmentTypeValue)}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      ) : null}

      {canClearFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {q ? <Badge>Search: {q}</Badge> : null}
          {statuses.map((statusValue) => (
            <Badge key={statusValue}>Status: {statusLabels[statusValue]}</Badge>
          ))}
          {remoteTypes.map((remoteTypeValue) => (
            <Badge key={remoteTypeValue}>
              Remote: {formatRemoteTypeLabel(remoteTypeValue)}
            </Badge>
          ))}
          {employmentTypes.map((employmentTypeValue) => (
            <Badge key={employmentTypeValue}>
              Employment: {formatEmploymentTypeLabel(employmentTypeValue)}
            </Badge>
          ))}
          {sort !== "newest" ? (
            <Badge>
              Sort: {sort === "deadlineSoonest" ? "Deadline soonest" : "Follow-up soonest"}
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => {
              setSelectedStatuses([]);
              setSelectedRemoteTypes([]);
              setSelectedEmploymentTypes([]);

              if (hasAnyActiveFilters) {
                router.replace(clearFiltersHref);
              }
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : null}
    </form>
  );
}
