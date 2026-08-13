import { safeExternalUrlSchema } from "@/lib/url";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "@/features/jobs/status";

export type JobQuickActionTarget = {
  id: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  url: string | null;
};

export function getJobQuickActions(job: JobQuickActionTarget) {
  const parsedUrl = job.url ? safeExternalUrlSchema.safeParse(job.url) : null;

  return {
    statusOptions: APPLICATION_STATUSES.map((status) => ({
      status,
      isCurrent: status === job.status,
    })),
    archiveLabel: job.status === "ARCHIVED" ? "Unarchive" : "Archive",
    // Old jobs may contain values saved before URL validation was introduced.
    // Only expose external navigation for a currently safe HTTP(S) destination.
    jobPostingUrl: parsedUrl?.success ? parsedUrl.data : undefined,
  };
}
