import { z } from "zod";

export const MAX_JOB_MATCH_RESUME_TEXT_CHARS = 6_000;
export const PRODUCTION_DAILY_JOB_MATCH_LIMIT = 5;
const MAX_JOB_MATCH_LIST_ITEMS = 8;

export const analyzeJobMatchSchema = z.object({
  jobId: z.string().min(1, "Job is required."),
});

export const jobMatchFitLevelSchema = z.enum(["LOW", "MODERATE", "STRONG"]);

export const aiJobMatchResponseSchema = z
  .object({
    overallFitSummary: z.string().trim().min(1),
    fitLevel: jobMatchFitLevelSchema,
    matchingSkills: z.array(z.string().trim()),
    missingOrWeakSkills: z.array(z.string().trim()),
    relevantProfileEvidence: z.array(z.string().trim()),
    resumeImprovementSuggestions: z.array(z.string().trim()),
    interviewPrepFocusAreas: z.array(z.string().trim()),
    warnings: z.array(z.string().trim()),
  })
  .strict();

export const normalizedJobMatchReportSchema = z
  .object({
    overallFitSummary: z.string().trim().min(1),
    fitLevel: jobMatchFitLevelSchema,
    matchingSkills: z.array(z.string().trim().min(1)).max(MAX_JOB_MATCH_LIST_ITEMS),
    missingOrWeakSkills: z.array(z.string().trim().min(1)).max(MAX_JOB_MATCH_LIST_ITEMS),
    relevantProfileEvidence: z
      .array(z.string().trim().min(1))
      .max(MAX_JOB_MATCH_LIST_ITEMS),
    resumeImprovementSuggestions: z
      .array(z.string().trim().min(1))
      .max(MAX_JOB_MATCH_LIST_ITEMS),
    interviewPrepFocusAreas: z
      .array(z.string().trim().min(1))
      .max(MAX_JOB_MATCH_LIST_ITEMS),
    warnings: z.array(z.string().trim().min(1)).max(MAX_JOB_MATCH_LIST_ITEMS),
  })
  .strict();

export type AIJobMatchResponse = z.infer<typeof aiJobMatchResponseSchema>;
export type JobMatchFitLevel = z.infer<typeof jobMatchFitLevelSchema>;
export type JobMatchReport = z.infer<typeof normalizedJobMatchReportSchema>;
const JOB_MATCH_SUMMARY_PREFIX =
  "Based on your saved profile and this job's analysis, ";

function normalizeOverallFitSummary(summary: string) {
  const normalizedSummary = summary.trim();
  const hasProfileReference = /saved profile/i.test(normalizedSummary);
  const hasJobReference =
    /job(?:'s)? analysis|job analysis|this job|role/i.test(normalizedSummary);

  if (hasProfileReference && hasJobReference) {
    return normalizedSummary;
  }

  return `${JOB_MATCH_SUMMARY_PREFIX}${normalizedSummary.charAt(0).toLowerCase()}${normalizedSummary.slice(1)}`;
}

function normalizeList(values: string[]) {
  const seen = new Set<string>();
  const normalizedValues: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      continue;
    }

    const dedupeKey = trimmedValue.toLocaleLowerCase();

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalizedValues.push(trimmedValue);

    if (normalizedValues.length >= MAX_JOB_MATCH_LIST_ITEMS) {
      break;
    }
  }

  return normalizedValues;
}

export function normalizeResumeTextForJobMatch(
  resumeText: string | null | undefined,
): string | null {
  const normalizedResumeText = resumeText
    ?.replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalizedResumeText) {
    return null;
  }

  return normalizedResumeText.slice(0, MAX_JOB_MATCH_RESUME_TEXT_CHARS);
}

export function normalizeJobMatchReport(
  input: AIJobMatchResponse,
): JobMatchReport {
  return normalizedJobMatchReportSchema.parse({
    overallFitSummary: normalizeOverallFitSummary(input.overallFitSummary),
    fitLevel: input.fitLevel,
    matchingSkills: normalizeList(input.matchingSkills),
    missingOrWeakSkills: normalizeList(input.missingOrWeakSkills),
    relevantProfileEvidence: normalizeList(input.relevantProfileEvidence),
    resumeImprovementSuggestions: normalizeList(input.resumeImprovementSuggestions),
    interviewPrepFocusAreas: normalizeList(input.interviewPrepFocusAreas),
    warnings: normalizeList(input.warnings),
  });
}

export function mergeJobMatchWarnings(
  report: JobMatchReport,
  additionalWarnings: string[],
): JobMatchReport {
  return normalizedJobMatchReportSchema.parse({
    ...report,
    warnings: normalizeList([...report.warnings, ...additionalWarnings]),
  });
}
