import type { JobImportSeed } from "@/features/jobs/schemas";
import type { DetectedJobImportSource } from "@/features/jobs/importers/job-url";

export type JobImportWarning = {
  code:
    | "INFERRED_COMPANY"
    | "INVALID_APPLICATION_DEADLINE"
    | "INVALID_BASE_SALARY"
    | "INVALID_EXTERNAL_URL"
    | "MALFORMED_JSON_LD"
    | "MULTIPLE_JOB_POSTINGS";
  message: string;
};

export type JobImportResult =
  | {
      seed: JobImportSeed;
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
          | "MALFORMED_URL"
          | "MALFORMED_EXTERNAL_DATA"
          | "UNSAFE_URL"
          | "UNSUPPORTED_SOURCE";
        message: string;
      };
      success: false;
    };
