import { describe, expect, it } from "vitest";

import {
  AI_USAGE_POLICY,
  AiUsageFeature,
} from "@/features/ai-usage/policy";

describe("AI usage policy", () => {
  it("keeps the existing analysis and career-guidance limits centralized", () => {
    expect(AI_USAGE_POLICY[AiUsageFeature.JOB_ANALYSIS].dailyLimit).toBe(3);
    expect(AI_USAGE_POLICY[AiUsageFeature.JOB_MATCH].dailyLimit).toBe(5);
    expect(AI_USAGE_POLICY[AiUsageFeature.INTERVIEW_PREP].dailyLimit).toBe(5);
  });

  it("intentionally shares a quota only between job match and interview prep", () => {
    expect(AI_USAGE_POLICY[AiUsageFeature.JOB_MATCH].quota).toBe(
      AI_USAGE_POLICY[AiUsageFeature.INTERVIEW_PREP].quota,
    );
    expect(AI_USAGE_POLICY[AiUsageFeature.JOB_ANALYSIS].quota).not.toBe(
      AI_USAGE_POLICY[AiUsageFeature.JOB_MATCH].quota,
    );
  });

  it("meters both profile extraction entry points through their shared pool", () => {
    expect(AI_USAGE_POLICY[AiUsageFeature.PROFILE_EXTRACTION]).toEqual({
      dailyLimit: 3,
      quota: "PROFILE_EXTRACTION",
    });
    expect(AI_USAGE_POLICY[AiUsageFeature.RESUME_EXTRACTION]).toEqual({
      dailyLimit: 3,
      quota: "PROFILE_EXTRACTION",
    });
  });
});
