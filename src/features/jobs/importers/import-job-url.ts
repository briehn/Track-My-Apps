import { importGreenhouseJob } from "@/features/jobs/importers/greenhouse";
import { detectJobImportSource } from "@/features/jobs/importers/job-url";
import type { JobImportResult } from "@/features/jobs/importers/types";

export async function importJobFromUrl(submittedUrl: string): Promise<JobImportResult> {
  const detectedSource = detectJobImportSource(submittedUrl);

  if (!detectedSource.success) {
    return {
      error: detectedSource.error,
      success: false,
    };
  }

  return importGreenhouseJob(detectedSource.source);
}
