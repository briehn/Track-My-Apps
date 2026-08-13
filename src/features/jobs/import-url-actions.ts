"use server";

import { requireUser } from "@/features/auth/require-user";
import {
  findJobImportDuplicateForUser,
  type JobImportDuplicateWarning,
} from "@/features/jobs/importers/duplicate-detection";
import { importJobFromUrl } from "@/features/jobs/importers/import-job-url";
import type { JobImportWarning } from "@/features/jobs/importers/types";
import type { JobImportSeed } from "@/features/jobs/schemas";
import { prisma } from "@/server/db/prisma";

export type JobUrlImportActionResult =
  | {
      seed: JobImportSeed;
      duplicate?: JobImportDuplicateWarning;
      success: true;
      warnings: JobImportWarning[];
    }
  | {
      message: string;
      success: false;
    };

function getImportFailureMessage(code: string) {
  if (code === "INVALID_URL") {
    return "Enter a valid http:// or https:// job URL.";
  }

  if (code === "UNSUPPORTED_SOURCE") {
    return "This job site isn't supported for automatic import yet. You can still add the job manually.";
  }

  return "We couldn't import this posting. You can try again or enter the details manually.";
}

async function getJobsForDuplicateDetection(userId: string) {
  return prisma.job.findMany({
    where: { userId },
    select: {
      company: true,
      id: true,
      title: true,
      url: true,
    },
  });
}

export async function importJobUrlForCurrentUser(
  submittedUrl: string,
): Promise<JobUrlImportActionResult> {
  const user = await requireUser();
  const result = await importJobFromUrl(submittedUrl);

  if (!result.success) {
    return {
      message: getImportFailureMessage(result.error.code),
      success: false,
    };
  }

  const duplicate = await findJobImportDuplicateForUser(
    user.id,
    result.seed,
    getJobsForDuplicateDetection,
  );

  return {
    seed: result.seed,
    ...(duplicate ? { duplicate } : {}),
    success: true,
    warnings: result.warnings,
  };
}
