import { describe, expect, it } from "vitest";

import {
  hasAnalyzableJobDescription,
  isJobDescriptionTooLong,
  MAX_JOB_DESCRIPTION_ANALYSIS_CHARS,
  MIN_JOB_DESCRIPTION_LENGTH,
  normalizeJobAnalysis,
} from "@/features/job-analysis/schemas";

describe("hasAnalyzableJobDescription", () => {
  it("enforces the minimum-length boundary", () => {
    expect(hasAnalyzableJobDescription("a".repeat(MIN_JOB_DESCRIPTION_LENGTH - 1))).toBe(
      false,
    );
    expect(hasAnalyzableJobDescription("a".repeat(MIN_JOB_DESCRIPTION_LENGTH))).toBe(true);
    expect(hasAnalyzableJobDescription(" ".repeat(MIN_JOB_DESCRIPTION_LENGTH + 5))).toBe(
      false,
    );
  });
});

describe("isJobDescriptionTooLong", () => {
  it("enforces the 10,000-character boundary", () => {
    expect(
      isJobDescriptionTooLong("a".repeat(MAX_JOB_DESCRIPTION_ANALYSIS_CHARS)),
    ).toBe(false);
    expect(
      isJobDescriptionTooLong("a".repeat(MAX_JOB_DESCRIPTION_ANALYSIS_CHARS + 1)),
    ).toBe(true);
  });
});

describe("normalizeJobAnalysis", () => {
  it("trims values, removes blanks, dedupes case-insensitively, caps lists, and normalizes empty seniority", () => {
    const requiredSkills = [
      "  TypeScript  ",
      "",
      "typescript",
      "Node.js",
      ...Array.from({ length: 20 }, (_, index) => `Skill ${index}`),
    ];

    const result = normalizeJobAnalysis({
      summary: "  Build APIs for internal tools.  ",
      requiredSkills,
      preferredSkills: ["  AWS  ", "aws", " ", "GraphQL"],
      responsibilities: [" Build APIs ", "build apis", "", "Mentor engineers"],
      keywords: [" Fintech ", "", "fintech", "Payments"],
      seniorityLevel: "   ",
    });

    expect(result.summary).toBe("Build APIs for internal tools.");
    expect(result.requiredSkills).toEqual([
      "TypeScript",
      "Node.js",
      "Skill 0",
      "Skill 1",
      "Skill 2",
      "Skill 3",
      "Skill 4",
      "Skill 5",
      "Skill 6",
      "Skill 7",
      "Skill 8",
      "Skill 9",
      "Skill 10",
      "Skill 11",
      "Skill 12",
    ]);
    expect(result.preferredSkills).toEqual(["AWS", "GraphQL"]);
    expect(result.responsibilities).toEqual(["Build APIs", "Mentor engineers"]);
    expect(result.keywords).toEqual(["Fintech", "Payments"]);
    expect(result.seniorityLevel).toBeNull();
  });
});
