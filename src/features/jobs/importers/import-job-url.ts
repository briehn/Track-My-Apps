import { importGemJob } from "@/features/jobs/importers/gem";
import { importGreenhouseJob } from "@/features/jobs/importers/greenhouse";
import { importJsonLdJob } from "@/features/jobs/importers/json-ld";
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

  if (detectedSource.source.kind === "GREENHOUSE") {
    return importGreenhouseJob(detectedSource.source);
  }
  if (detectedSource.source.kind === "LEVER") {
    return importLeverJob(detectedSource.source);
  }
  if (detectedSource.source.kind === "GEM") {
    return importGemJob(detectedSource.source);
  }

  return importJsonLdJob(detectedSource.source);
}
