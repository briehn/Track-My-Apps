import type { JobImportSeed } from "@/features/jobs/schemas";

import { normalizeJobUrl } from "@/features/jobs/importers/duplicate-detection";

export const JOB_URL_IMPORT_MAX_BATCH_SIZE = 20;
export const JOB_URL_IMPORT_CONCURRENCY = 3;

export type SubmittedJobUrl = {
  lineNumber: number;
  submittedUrl: string;
};

export type ParsedBulkJobUrls = {
  entries: SubmittedJobUrl[];
  ignoredBlankLineCount: number;
};

export function parseBulkJobUrls(value: string): ParsedBulkJobUrls {
  let ignoredBlankLineCount = 0;
  const entries: SubmittedJobUrl[] = [];

  value.split(/\r?\n/).forEach((line, index) => {
    const submittedUrl = line.trim();

    if (!submittedUrl) {
      ignoredBlankLineCount += 1;
      return;
    }

    entries.push({
      lineNumber: index + 1,
      submittedUrl,
    });
  });

  return { entries, ignoredBlankLineCount };
}

export async function mapWithConcurrency<T, Result>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<Result>,
): Promise<Result[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("Concurrency must be a positive integer.");
  }

  const results = new Array<Result>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const itemIndex = nextIndex;
      nextIndex += 1;
      results[itemIndex] = await mapper(items[itemIndex], itemIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  );

  return results;
}

export function getInBatchDuplicateKey(seed: JobImportSeed) {
  const normalizedUrl = normalizeJobUrl(seed.url);

  return normalizedUrl ? `url:${normalizedUrl}` : undefined;
}
