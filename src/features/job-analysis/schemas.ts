import { z } from "zod";

export const MIN_JOB_DESCRIPTION_LENGTH = 80;
export const MAX_JOB_DESCRIPTION_ANALYSIS_CHARS = 10_000;
export const PRODUCTION_DAILY_AI_ANALYSIS_LIMIT = 3;
const MAX_LIST_ITEMS = 15;

export const analyzeJobDescriptionSchema = z.object({
  jobId: z.string().min(1, "Job is required."),
});

export const aiJobAnalysisResponseSchema = z
  .object({
    summary: z.string().trim().min(1),
    requiredSkills: z.array(z.string().trim()),
    preferredSkills: z.array(z.string().trim()),
    responsibilities: z.array(z.string().trim()),
    keywords: z.array(z.string().trim()),
    seniorityLevel: z.string().trim().nullable(),
  })
  .strict();

export const normalizedJobAnalysisSchema = z
  .object({
    summary: z.string().trim().min(1),
    requiredSkills: z.array(z.string().trim().min(1)).max(MAX_LIST_ITEMS),
    preferredSkills: z.array(z.string().trim().min(1)).max(MAX_LIST_ITEMS),
    responsibilities: z.array(z.string().trim().min(1)).max(MAX_LIST_ITEMS),
    keywords: z.array(z.string().trim().min(1)).max(MAX_LIST_ITEMS),
    seniorityLevel: z.string().trim().min(1).nullable(),
  })
  .strict();

export type AIJobAnalysisResponse = z.infer<typeof aiJobAnalysisResponseSchema>;
export type NormalizedJobAnalysis = z.infer<typeof normalizedJobAnalysisSchema>;

export function hasAnalyzableJobDescription(
  description: string | null | undefined,
): description is string {
  return Boolean(description && description.trim().length >= MIN_JOB_DESCRIPTION_LENGTH);
}

export function isJobDescriptionTooLong(description: string): boolean {
  return description.length > MAX_JOB_DESCRIPTION_ANALYSIS_CHARS;
}

function normalizeList(values: string[]) {
  const seen = new Set<string>();
  const normalizedValues: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      continue;
    }

    const dedupeKey = trimmedValue.toLowerCase();

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalizedValues.push(trimmedValue);

    if (normalizedValues.length >= MAX_LIST_ITEMS) {
      break;
    }
  }

  return normalizedValues;
}

export function normalizeJobAnalysis(
  input: AIJobAnalysisResponse,
): NormalizedJobAnalysis {
  return normalizedJobAnalysisSchema.parse({
    summary: input.summary.trim(),
    requiredSkills: normalizeList(input.requiredSkills),
    preferredSkills: normalizeList(input.preferredSkills),
    responsibilities: normalizeList(input.responsibilities),
    keywords: normalizeList(input.keywords),
    seniorityLevel: input.seniorityLevel?.trim() || null,
  });
}
