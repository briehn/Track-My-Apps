import type { JobImportSeed } from "@/features/jobs/schemas";

type ExistingJobForDuplicateDetection = {
  company: string;
  id: string;
  title: string;
  url: string | null;
};

export type JobImportDuplicateWarning = {
  jobId: string;
  reason: "COMPANY_TITLE" | "URL";
};

type FindJobsForUser = (userId: string) => Promise<ExistingJobForDuplicateDetection[]>;

function normalizeLabel(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeJobUrl(value: string | undefined | null) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

export function findJobDraftDuplicate(
  draft: JobImportSeed,
  existingJobs: ExistingJobForDuplicateDetection[],
): JobImportDuplicateWarning | undefined {
  const normalizedDraftUrl = normalizeJobUrl(draft.url);

  if (normalizedDraftUrl) {
    const duplicateByUrl = existingJobs.find(
      (job) => normalizeJobUrl(job.url) === normalizedDraftUrl,
    );

    return duplicateByUrl
      ? { jobId: duplicateByUrl.id, reason: "URL" }
      : undefined;
  }

  if (!draft.company || !draft.title) {
    return undefined;
  }

  const normalizedDraftCompanyTitle = `${normalizeLabel(draft.company)}::${normalizeLabel(draft.title)}`;
  const duplicateByCompanyTitle = existingJobs.find(
    (job) =>
      `${normalizeLabel(job.company)}::${normalizeLabel(job.title)}` ===
      normalizedDraftCompanyTitle,
  );

  return duplicateByCompanyTitle
    ? { jobId: duplicateByCompanyTitle.id, reason: "COMPANY_TITLE" }
    : undefined;
}

export async function findJobImportDuplicateForUser(
  userId: string,
  draft: JobImportSeed,
  findJobsForUser: FindJobsForUser,
) {
  const existingJobs = await findJobsForUser(userId);
  return findJobDraftDuplicate(draft, existingJobs);
}
