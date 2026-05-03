import type { JobDetail, JobListItem } from "@/features/jobs/queries";

export type JobStatus = JobDetail["status"] | JobListItem["status"];

export const statusLabels: Record<JobStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

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
