import { importGreenhouseJob } from "@/features/jobs/importers/greenhouse";
import { detectJobImportSource } from "@/features/jobs/importers/job-url";
import { importLeverJob } from "@/features/jobs/importers/lever";
import type { JobImportResult } from "@/features/jobs/importers/types";

export async function importJobFromUrl(submittedUrl: string): Promise<JobImportResult> {
  const detectedSource = detectJobImportSource(submittedUrl);

  if (!detectedSource.success) {
    return {
      error: detectedSource.error,
      success: false,
    };
  }

  return detectedSource.source.kind === "GREENHOUSE"
    ? importGreenhouseJob(detectedSource.source)
    : importLeverJob(detectedSource.source);
}
