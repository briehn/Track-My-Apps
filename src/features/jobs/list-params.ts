import type { EmploymentType, RemoteType } from "@prisma/client";

import {
  APPLICATION_STATUSES,
  isApplicationStatus,
  type ApplicationStatus,
} from "@/features/jobs/status";

export type JobListStatusView = "active" | "archived";
export type JobListSort = "newest" | "deadlineSoonest" | "followUpSoonest";

export type JobListFilters = {
  employmentTypes: EmploymentType[];
  q: string;
  remoteTypes: RemoteType[];
  sort: JobListSort;
  statuses: ApplicationStatus[];
  view: JobListStatusView;
};

type SearchParamValue = string | string[] | undefined;

export type JobsSearchParamsInput = Record<string, SearchParamValue>;

const REMOTE_TYPES: readonly RemoteType[] = ["ONSITE", "HYBRID", "REMOTE"];
const EMPLOYMENT_TYPES: readonly EmploymentType[] = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
];

function getSingleParamValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    const firstValue = value[0];
    return typeof firstValue === "string" ? firstValue : null;
  }

  return typeof value === "string" ? value : null;
}

function getMultiParamValues(value: SearchParamValue): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function normalizeSearchText(value: string | null): string {
  return value?.trim() ?? "";
}

function isJobListSort(value: string): value is JobListSort {
  return (
    value === "newest" ||
    value === "deadlineSoonest" ||
    value === "followUpSoonest"
  );
}

function isRemoteType(value: string): value is RemoteType {
  return (REMOTE_TYPES as readonly string[]).includes(value);
}

function isEmploymentType(value: string): value is EmploymentType {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(value);
}

function parseCsvOrMultiValues(value: SearchParamValue): string[] {
  return getMultiParamValues(value)
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function dedupePreserveOrder<T extends string>(values: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

export function normalizeJobsSearchParams(
  searchParams: JobsSearchParamsInput,
): JobListFilters {
  const statusViewParam = getSingleParamValue(searchParams.status);
  const view: JobListStatusView =
    statusViewParam === "archived" ? "archived" : "active";

  const q = normalizeSearchText(getSingleParamValue(searchParams.q));

  const statusValues = parseCsvOrMultiValues(searchParams.statuses);
  const fallbackStatusValue = getSingleParamValue(searchParams.status);
  const statuses = dedupePreserveOrder(
    [
      ...statusValues,
      ...(fallbackStatusValue &&
      fallbackStatusValue !== "archived" &&
      isApplicationStatus(fallbackStatusValue)
        ? [fallbackStatusValue]
        : []),
    ].filter(isApplicationStatus),
  );

  const remoteTypeValues = parseCsvOrMultiValues(searchParams.remoteTypes);
  const fallbackRemoteTypeValue = getSingleParamValue(searchParams.remoteType);
  const remoteTypes = dedupePreserveOrder(
    [
      ...remoteTypeValues,
      ...(fallbackRemoteTypeValue && isRemoteType(fallbackRemoteTypeValue)
        ? [fallbackRemoteTypeValue]
        : []),
    ].filter(isRemoteType),
  );

  const employmentTypeValues = parseCsvOrMultiValues(searchParams.employmentTypes);
  const fallbackEmploymentTypeValue = getSingleParamValue(searchParams.employmentType);
  const employmentTypes = dedupePreserveOrder(
    [
      ...employmentTypeValues,
      ...(fallbackEmploymentTypeValue && isEmploymentType(fallbackEmploymentTypeValue)
        ? [fallbackEmploymentTypeValue]
        : []),
    ].filter(isEmploymentType),
  );

  const sortParam = getSingleParamValue(searchParams.sort);
  const sort: JobListSort =
    sortParam && isJobListSort(sortParam) ? sortParam : "newest";

  return {
    view,
    q,
    statuses,
    remoteTypes,
    employmentTypes,
    sort,
  };
}

export function buildJobsQueryString(
  filters: JobListFilters,
  overrides?: Partial<JobListFilters>,
): string {
  const mergedFilters: JobListFilters = {
    ...filters,
    ...overrides,
  };
  const params = new URLSearchParams();

  if (mergedFilters.view === "archived") {
    params.set("status", "archived");
  } else if (mergedFilters.statuses.length > 0) {
    const filteredStatuses = mergedFilters.statuses.filter(
      (value) => value !== "ARCHIVED",
    );
    if (filteredStatuses.length > 0) {
      params.set("statuses", filteredStatuses.join(","));
    }
  }

  if (mergedFilters.q) {
    params.set("q", mergedFilters.q);
  }

  if (mergedFilters.remoteTypes.length > 0) {
    params.set("remoteTypes", mergedFilters.remoteTypes.join(","));
  }

  if (mergedFilters.employmentTypes.length > 0) {
    params.set("employmentTypes", mergedFilters.employmentTypes.join(","));
  }

  if (mergedFilters.sort !== "newest") {
    params.set("sort", mergedFilters.sort);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export const jobListStatusOptions = APPLICATION_STATUSES;
