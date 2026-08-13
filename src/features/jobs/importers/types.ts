import type { JobDraft } from "@/features/jobs/schemas";
import type { DetectedJobImportSource } from "@/features/jobs/importers/job-url";

export type JobImportWarning = {
  code: "INVALID_APPLICATION_DEADLINE" | "INVALID_EXTERNAL_URL";
  message: string;
};

export type JobImportResult =
  | {
      draft: JobDraft;
      source: DetectedJobImportSource;
      success: true;
      warnings: JobImportWarning[];
    }
  | {
      error: {
        code:
          | "EXTRACTION_FAILED"
          | "INVALID_URL"
          | "INVALID_DRAFT"
          | "MALFORMED_EXTERNAL_DATA"
          | "UNSUPPORTED_SOURCE";
        message: string;
      };
      success: false;
    };
