export const AiUsageFeature = {
  INTERVIEW_PREP: "INTERVIEW_PREP",
  JOB_ANALYSIS: "JOB_ANALYSIS",
  JOB_MATCH: "JOB_MATCH",
  PROFILE_EXTRACTION: "PROFILE_EXTRACTION",
  RESUME_EXTRACTION: "RESUME_EXTRACTION",
} as const;

export type AiUsageFeature = (typeof AiUsageFeature)[keyof typeof AiUsageFeature];

export const OPENAI_REQUEST_TIMEOUT_MS = 30_000;

export const AI_USAGE_POLICY = {
  [AiUsageFeature.JOB_ANALYSIS]: { dailyLimit: 3, quota: "JOB_ANALYSIS" },
  [AiUsageFeature.JOB_MATCH]: { dailyLimit: 5, quota: "CAREER_GUIDANCE" },
  [AiUsageFeature.INTERVIEW_PREP]: { dailyLimit: 5, quota: "CAREER_GUIDANCE" },
  [AiUsageFeature.PROFILE_EXTRACTION]: { dailyLimit: 3, quota: "PROFILE_EXTRACTION" },
  [AiUsageFeature.RESUME_EXTRACTION]: { dailyLimit: 3, quota: "PROFILE_EXTRACTION" },
} as const;
