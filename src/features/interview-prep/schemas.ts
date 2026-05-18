import { z } from "zod";

export const MAX_INTERVIEW_PREP_RESUME_TEXT_CHARS = 6_000;
const MAX_INTERVIEW_PREP_LIST_ITEMS = 8;

export const analyzeInterviewPrepSchema = z.object({
  jobId: z.string().min(1, "Job is required."),
});

export const aiInterviewPrepResponseSchema = z
  .object({
    prepSummary: z.string().trim().min(1),
    likelyTechnicalQuestions: z.array(z.string().trim()),
    likelyBehavioralQuestions: z.array(z.string().trim()),
    roleSpecificTalkingPoints: z.array(z.string().trim()),
    topicsToReview: z.array(z.string().trim()),
    gapsOrWeakAreas: z.array(z.string().trim()),
    questionsToAskInterviewer: z.array(z.string().trim()),
    warnings: z.array(z.string().trim()),
  })
  .strict();

export const normalizedInterviewPrepReportSchema = z
  .object({
    prepSummary: z.string().trim().min(1),
    likelyTechnicalQuestions: z
      .array(z.string().trim().min(1))
      .max(MAX_INTERVIEW_PREP_LIST_ITEMS),
    likelyBehavioralQuestions: z
      .array(z.string().trim().min(1))
      .max(MAX_INTERVIEW_PREP_LIST_ITEMS),
    roleSpecificTalkingPoints: z
      .array(z.string().trim().min(1))
      .max(MAX_INTERVIEW_PREP_LIST_ITEMS),
    topicsToReview: z
      .array(z.string().trim().min(1))
      .max(MAX_INTERVIEW_PREP_LIST_ITEMS),
    gapsOrWeakAreas: z
      .array(z.string().trim().min(1))
      .max(MAX_INTERVIEW_PREP_LIST_ITEMS),
    questionsToAskInterviewer: z
      .array(z.string().trim().min(1))
      .max(MAX_INTERVIEW_PREP_LIST_ITEMS),
    warnings: z.array(z.string().trim().min(1)).max(MAX_INTERVIEW_PREP_LIST_ITEMS),
  })
  .strict();

export type AIInterviewPrepResponse = z.infer<typeof aiInterviewPrepResponseSchema>;
export type InterviewPrepReport = z.infer<typeof normalizedInterviewPrepReportSchema>;

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

    if (normalizedValues.length >= MAX_INTERVIEW_PREP_LIST_ITEMS) {
      break;
    }
  }

  return normalizedValues;
}

export function normalizeResumeTextForInterviewPrep(
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

  return normalizedResumeText.slice(0, MAX_INTERVIEW_PREP_RESUME_TEXT_CHARS);
}

export function normalizeInterviewPrepReport(
  input: AIInterviewPrepResponse,
): InterviewPrepReport {
  return normalizedInterviewPrepReportSchema.parse({
    prepSummary: input.prepSummary.trim(),
    likelyTechnicalQuestions: normalizeList(input.likelyTechnicalQuestions),
    likelyBehavioralQuestions: normalizeList(input.likelyBehavioralQuestions),
    roleSpecificTalkingPoints: normalizeList(input.roleSpecificTalkingPoints),
    topicsToReview: normalizeList(input.topicsToReview),
    gapsOrWeakAreas: normalizeList(input.gapsOrWeakAreas),
    questionsToAskInterviewer: normalizeList(input.questionsToAskInterviewer),
    warnings: normalizeList(input.warnings),
  });
}

export function mergeInterviewPrepWarnings(
  report: InterviewPrepReport,
  additionalWarnings: string[],
): InterviewPrepReport {
  return normalizedInterviewPrepReportSchema.parse({
    ...report,
    warnings: normalizeList([...report.warnings, ...additionalWarnings]),
  });
}
