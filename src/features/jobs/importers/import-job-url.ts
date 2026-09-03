import { importDoverJob } from "@/features/jobs/importers/dover";
import { importFourDayWeekJob } from "@/features/jobs/importers/four-day-week";
import { importGemJob } from "@/features/jobs/importers/gem";
import { importGreenhouseJob } from "@/features/jobs/importers/greenhouse";
import { importJsonLdJob } from "@/features/jobs/importers/json-ld";
import { detectJobImportSource } from "@/features/jobs/importers/job-url";
import { importLeverJob } from "@/features/jobs/importers/lever";
import { importRipplingJob } from "@/features/jobs/importers/rippling";
import { importWorkAtAStartupJob } from "@/features/jobs/importers/work-at-a-startup";
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
  if (detectedSource.source.kind === "RIPPLING") {
    return importRipplingJob(detectedSource.source);
  }
  if (detectedSource.source.kind === "FOUR_DAY_WEEK") {
    return importFourDayWeekJob(detectedSource.source);
  }
  if (detectedSource.source.kind === "WORK_AT_A_STARTUP") {
    return importWorkAtAStartupJob(detectedSource.source);
  }
  if (detectedSource.source.kind === "DOVER") {
    return importDoverJob(detectedSource.source);
  }

  return importJsonLdJob(detectedSource.source);
}
