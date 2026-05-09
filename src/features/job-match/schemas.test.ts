import { describe, expect, it } from "vitest";

import {
  MAX_JOB_MATCH_RESUME_TEXT_CHARS,
  mergeJobMatchWarnings,
  normalizeJobMatchReport,
  normalizeResumeTextForJobMatch,
} from "@/features/job-match/schemas";

describe("normalizeResumeTextForJobMatch", () => {
  it("returns null for missing or blank resume text", () => {
    expect(normalizeResumeTextForJobMatch(undefined)).toBeNull();
    expect(normalizeResumeTextForJobMatch(null)).toBeNull();
    expect(normalizeResumeTextForJobMatch("  \n\n ")).toBeNull();
  });

  it("normalizes whitespace and caps resume text length", () => {
    const normalizedResumeText = normalizeResumeTextForJobMatch(
      `  Line one\r\n\r\n\r\n${"a".repeat(MAX_JOB_MATCH_RESUME_TEXT_CHARS + 50)}  `,
    );

    expect(normalizedResumeText).not.toBeNull();
    expect(normalizedResumeText?.startsWith("Line one\n\na")).toBe(true);
    expect(normalizedResumeText?.length).toBe(MAX_JOB_MATCH_RESUME_TEXT_CHARS);
  });
});

describe("normalizeJobMatchReport", () => {
  it("trims and dedupes list content", () => {
    const report = normalizeJobMatchReport({
      overallFitSummary: "  Strong overlap in operations and reporting work.  ",
      fitLevel: "MODERATE",
      matchingSkills: [" Excel ", "excel", "Operations"],
      missingOrWeakSkills: ["SQL", " sql ", "Stakeholder management"],
      relevantProfileEvidence: ["Led reporting", "led reporting", "Managed operations"],
      resumeImprovementSuggestions: [
        " Highlight existing dashboard work if applicable ",
        "Highlight existing dashboard work if applicable",
      ],
      interviewPrepFocusAreas: ["Cross-functional planning", "cross-functional planning"],
      warnings: [" Resume text is missing ", "resume text is missing"],
    });

    expect(report).toEqual({
      overallFitSummary:
        "Based on your saved profile and this job's analysis, strong overlap in operations and reporting work.",
      fitLevel: "MODERATE",
      matchingSkills: ["Excel", "Operations"],
      missingOrWeakSkills: ["SQL", "Stakeholder management"],
      relevantProfileEvidence: ["Led reporting", "Managed operations"],
      resumeImprovementSuggestions: ["Highlight existing dashboard work if applicable"],
      interviewPrepFocusAreas: ["Cross-functional planning"],
      warnings: ["Resume text is missing"],
    });
  });

  it("keeps grounded summary wording when already present", () => {
    const report = normalizeJobMatchReport({
      overallFitSummary:
        "Based on your saved profile and this job's analysis, the fit is moderate because SQL evidence is limited.",
      fitLevel: "MODERATE",
      matchingSkills: ["Excel"],
      missingOrWeakSkills: ["SQL"],
      relevantProfileEvidence: ["Saved profile lists Excel."],
      resumeImprovementSuggestions: ["Clarify SQL exposure if true."],
      interviewPrepFocusAreas: ["Reporting workflows"],
      warnings: [],
    });

    expect(report.overallFitSummary).toBe(
      "Based on your saved profile and this job's analysis, the fit is moderate because SQL evidence is limited.",
    );
  });
});

describe("mergeJobMatchWarnings", () => {
  it("adds deterministic warnings without duplicates", () => {
    const mergedReport = mergeJobMatchWarnings(
      {
        overallFitSummary: "Based on your saved profile and this job's analysis, the fit is moderate.",
        fitLevel: "MODERATE",
        matchingSkills: ["Excel"],
        missingOrWeakSkills: ["SQL"],
        relevantProfileEvidence: ["Saved profile lists Excel."],
        resumeImprovementSuggestions: ["Clarify SQL exposure if true."],
        interviewPrepFocusAreas: ["Reporting workflows"],
        warnings: ["Resume text is missing"],
      },
      ["Resume text is missing", "Your saved profile has limited structured detail."],
    );

    expect(mergedReport.warnings).toEqual([
      "Resume text is missing",
      "Your saved profile has limited structured detail.",
    ]);
  });
});
