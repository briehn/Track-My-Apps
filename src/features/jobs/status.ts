import type { JobDetail, JobListItem } from "@/features/jobs/queries";

export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
  "ARCHIVED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type JobStatus =
  | ApplicationStatus
  | JobDetail["status"]
  | JobListItem["status"];

const applicationStatusSet = new Set<string>(APPLICATION_STATUSES);

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return applicationStatusSet.has(value);
}

export const statusLabels: Record<JobStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export const applicationStatusOptions = APPLICATION_STATUSES.map((value) => ({
  value,
  label: statusLabels[value],
}));

export const statusBadgeVariants: Record<
  JobStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  SAVED: "neutral",
  APPLIED: "info",
  INTERVIEWING: "warning",
  OFFER: "success",
  REJECTED: "danger",
  ARCHIVED: "neutral",
};
