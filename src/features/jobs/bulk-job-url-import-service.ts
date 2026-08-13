import {
  getInBatchDuplicateKey,
  JOB_URL_IMPORT_CONCURRENCY,
  mapWithConcurrency,
  parseBulkJobUrls,
  type SubmittedJobUrl,
} from "@/features/jobs/bulk-job-url-import";
import { getJobImportFailureMessage } from "@/features/jobs/job-import-error-message";
import {
  findJobDraftDuplicate,
  type JobImportDuplicateWarning,
} from "@/features/jobs/importers/duplicate-detection";
import type { JobImportResult, JobImportWarning } from "@/features/jobs/importers/types";
import {
  createJobSchema,
  type CreateJobInput,
  type JobImportSeed,
} from "@/features/jobs/schemas";

type ExistingJobForDuplicateDetection = {
  company: string;
  id: string;
  title: string;
  url: string | null;
};

export type BulkJobUrlImportItem =
  | {
      batchDuplicateOfLineNumber?: number;
      duplicate?: JobImportDuplicateWarning;
      lineNumber: number;
      seed: JobImportSeed;
      source: Extract<JobImportResult, { success: true }>["source"];
      status: "success";
      submittedUrl: string;
      warnings: JobImportWarning[];
    }
  | {
      lineNumber: number;
      message: string;
      status: "failure";
      submittedUrl: string;
    };

export type BulkJobUrlImportReviewResult = {
  ignoredBlankLineCount: number;
  items: BulkJobUrlImportItem[];
};

type PrepareBulkJobUrlImportDependencies = {
  findExistingJobs: () => Promise<ExistingJobForDuplicateDetection[]>;
  importJob: (submittedUrl: string) => Promise<JobImportResult>;
};

function toBulkImportItem(
  submitted: SubmittedJobUrl,
  result: JobImportResult,
): BulkJobUrlImportItem {
  if (!result.success) {
    return {
      lineNumber: submitted.lineNumber,
      message: getJobImportFailureMessage(result.error.code),
      status: "failure",
      submittedUrl: submitted.submittedUrl,
    };
  }

  return {
    lineNumber: submitted.lineNumber,
    seed: result.seed,
    source: result.source,
    status: "success",
    submittedUrl: submitted.submittedUrl,
    warnings: result.warnings,
  };
}

export async function prepareBulkJobUrlImport(
  submittedText: string,
  dependencies: PrepareBulkJobUrlImportDependencies,
): Promise<BulkJobUrlImportReviewResult> {
  const parsedUrls = parseBulkJobUrls(submittedText);
  const importedItems = await mapWithConcurrency(
    parsedUrls.entries,
    JOB_URL_IMPORT_CONCURRENCY,
    async (submitted) => toBulkImportItem(submitted, await dependencies.importJob(submitted.submittedUrl)),
  );
  const existingJobs = await dependencies.findExistingJobs();
  const firstLineByCanonicalUrl = new Map<string, number>();

  const items = importedItems.map((item) => {
    if (item.status === "failure") {
      return item;
    }

    const duplicate = findJobDraftDuplicate(item.seed, existingJobs);
    const inBatchKey = getInBatchDuplicateKey(item.seed);
    const batchDuplicateOfLineNumber = inBatchKey
      ? firstLineByCanonicalUrl.get(inBatchKey)
      : undefined;

    if (inBatchKey && !batchDuplicateOfLineNumber) {
      firstLineByCanonicalUrl.set(inBatchKey, item.lineNumber);
    }

    return {
      ...item,
      ...(batchDuplicateOfLineNumber ? { batchDuplicateOfLineNumber } : {}),
      ...(duplicate ? { duplicate } : {}),
    };
  });

  return {
    ignoredBlankLineCount: parsedUrls.ignoredBlankLineCount,
    items,
  };
}

export type BulkJobSaveItem = {
  draft: Record<string, string | undefined>;
  reviewId: string;
};

export type BulkJobSaveItemResult =
  | { reviewId: string; status: "saved" }
  | {
      fieldErrors?: Record<string, string[] | undefined>;
      message: string;
      reviewId: string;
      status: "failure";
    };

export async function saveBulkJobUrlImports(
  items: BulkJobSaveItem[],
  persistJob: (input: CreateJobInput) => Promise<void>,
): Promise<BulkJobSaveItemResult[]> {
  return mapWithConcurrency(items, JOB_URL_IMPORT_CONCURRENCY, async (item) => {
      const parsedDraft = createJobSchema.safeParse(item.draft);

      if (!parsedDraft.success) {
        return {
          fieldErrors: parsedDraft.error.flatten().fieldErrors,
          message: "Review the highlighted fields before adding this job.",
          reviewId: item.reviewId,
          status: "failure" as const,
        };
      }

      try {
        await persistJob(parsedDraft.data);
        return { reviewId: item.reviewId, status: "saved" as const };
      } catch {
        return {
          message: "This job could not be added. Try again.",
          reviewId: item.reviewId,
          status: "failure" as const,
        };
      }
    });
}
