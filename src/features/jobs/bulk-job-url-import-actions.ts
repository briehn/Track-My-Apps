"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/features/auth/require-user";
import {
  JOB_URL_IMPORT_MAX_BATCH_SIZE,
  parseBulkJobUrls,
} from "@/features/jobs/bulk-job-url-import";
import {
  prepareBulkJobUrlImport,
  saveBulkJobUrlImports,
  type BulkJobSaveItem,
} from "@/features/jobs/bulk-job-url-import-service";
import { importJobFromUrl } from "@/features/jobs/importers/import-job-url";
import { canStartBulkJobUrlImport } from "@/features/jobs/import-rate-limit";
import { createJobForUser } from "@/features/jobs/job-persistence";
import { prisma } from "@/server/db/prisma";

const bulkJobUrlImportTextSchema = z.string().max(50_000, "Paste a smaller URL list.");

const bulkJobSaveItemSchema = z.object({
  draft: z
    .object({
      company: z.string().optional(),
      deadline: z.string().optional(),
      description: z.string().optional(),
      employmentType: z.string().optional(),
      location: z.string().optional(),
      remoteType: z.string().optional(),
      salaryCurrency: z.string().optional(),
      salaryMax: z.string().optional(),
      salaryMin: z.string().optional(),
      source: z.string().optional(),
      title: z.string().optional(),
      url: z.string().optional(),
    })
    .strict(),
  reviewId: z.string().min(1).max(100),
});

const bulkJobSaveItemsSchema = z.array(bulkJobSaveItemSchema).min(1).max(JOB_URL_IMPORT_MAX_BATCH_SIZE);

export type BulkJobUrlImportActionResult =
  | { formError: string; success: false }
  | ({ success: true } & Awaited<ReturnType<typeof prepareBulkJobUrlImport>>);

export type BulkJobUrlSaveActionResult =
  | { formError: string; success: false }
  | {
      results: Awaited<ReturnType<typeof saveBulkJobUrlImports>>;
      success: true;
    };

async function getJobsForDuplicateDetection(userId: string) {
  return prisma.job.findMany({
    where: { userId },
    select: { company: true, id: true, title: true, url: true },
  });
}

export async function reviewBulkJobUrls(
  submittedText: string,
): Promise<BulkJobUrlImportActionResult> {
  const user = await requireUser();
  const parsedText = bulkJobUrlImportTextSchema.safeParse(submittedText);

  if (!parsedText.success) {
    return { formError: parsedText.error.issues[0]?.message ?? "Paste a smaller URL list.", success: false };
  }

  const parsedUrls = parseBulkJobUrls(parsedText.data);

  if (parsedUrls.entries.length === 0) {
    return { formError: "Paste at least one job URL.", success: false };
  }

  if (parsedUrls.entries.length > JOB_URL_IMPORT_MAX_BATCH_SIZE) {
    return {
      formError: `Import up to ${JOB_URL_IMPORT_MAX_BATCH_SIZE} job URLs at a time.`,
      success: false,
    };
  }

  if (!(await canStartBulkJobUrlImport(user.id))) {
    return {
      formError: "Bulk URL imports are temporarily limited. Please try again in a minute.",
      success: false,
    };
  }

  const review = await prepareBulkJobUrlImport(parsedText.data, {
    findExistingJobs: () => getJobsForDuplicateDetection(user.id),
    importJob: importJobFromUrl,
  });

  return { ...review, success: true };
}

export async function saveBulkJobUrls(
  items: BulkJobSaveItem[],
): Promise<BulkJobUrlSaveActionResult> {
  const user = await requireUser();
  const parsedItems = bulkJobSaveItemsSchema.safeParse(items);

  if (!parsedItems.success) {
    return { formError: "Choose one or more valid jobs to add.", success: false };
  }

  const results = await saveBulkJobUrlImports(parsedItems.data, async (input) => {
    const createResult = await createJobForUser(user.id, input);

    if (!createResult.success) {
      throw new Error("Job validation failed unexpectedly.");
    }
  });

  if (results.some((result) => result.status === "saved")) {
    revalidatePath("/jobs");
  }

  return { results, success: true };
}
