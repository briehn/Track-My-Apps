import type { EmploymentType, RemoteType } from "@prisma/client";

import {
  APPLICATION_STATUSES,
  isApplicationStatus,
  type ApplicationStatus,
} from "@/features/jobs/status";

export type JobListStatusView = "active" | "archived";
export type JobListSort = "newest" | "deadlineSoonest" | "followUpSoonest";

export type JobListFilters = {
  employmentType: EmploymentType | null;
  q: string;
  remoteType: RemoteType | null;
  sort: JobListSort;
  status: ApplicationStatus | null;
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

export function normalizeJobsSearchParams(
  searchParams: JobsSearchParamsInput,
): JobListFilters {
  const statusViewParam = getSingleParamValue(searchParams.status);
  const view: JobListStatusView =
    statusViewParam === "archived" ? "archived" : "active";

  const q = normalizeSearchText(getSingleParamValue(searchParams.q));

  const statusParam = getSingleParamValue(searchParams.status);
  const status =
    statusParam && isApplicationStatus(statusParam) ? statusParam : null;

  const remoteTypeParam = getSingleParamValue(searchParams.remoteType);
  const remoteType =
    remoteTypeParam && isRemoteType(remoteTypeParam) ? remoteTypeParam : null;

  const employmentTypeParam = getSingleParamValue(searchParams.employmentType);
  const employmentType =
    employmentTypeParam && isEmploymentType(employmentTypeParam)
      ? employmentTypeParam
      : null;

  const sortParam = getSingleParamValue(searchParams.sort);
  const sort: JobListSort =
    sortParam && isJobListSort(sortParam) ? sortParam : "newest";

  return {
    view,
    q,
    status,
    remoteType,
    employmentType,
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
  } else if (mergedFilters.status && mergedFilters.status !== "ARCHIVED") {
    params.set("status", mergedFilters.status);
  }

  if (mergedFilters.q) {
    params.set("q", mergedFilters.q);
  }

  if (mergedFilters.remoteType) {
    params.set("remoteType", mergedFilters.remoteType);
  }

  if (mergedFilters.employmentType) {
    params.set("employmentType", mergedFilters.employmentType);
  }

  if (mergedFilters.sort !== "newest") {
    params.set("sort", mergedFilters.sort);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export const jobListStatusOptions = APPLICATION_STATUSES;
