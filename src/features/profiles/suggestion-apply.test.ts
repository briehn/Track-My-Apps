import { describe, expect, it } from "vitest";

import { mergeProfileExtractionSuggestionsIntoFormValues } from "@/features/profiles/suggestion-apply";

describe("mergeProfileExtractionSuggestionsIntoFormValues", () => {
  it("applies ZERO_TO_ONE even when current years value is higher", () => {
    const result = mergeProfileExtractionSuggestionsIntoFormValues(
      {
        targetTitleOption: "Software Engineer",
        yearsOfExperience: "TEN_PLUS",
      },
      {
        targetTitle: null,
        yearsOfExperience: "ZERO_TO_ONE",
        skills: [],
        experienceSummary: null,
        portfolioUrl: null,
        githubUrl: null,
        linkedinUrl: null,
        workPreferences: [],
      },
    );

    expect(result.yearsOfExperience).toBe("ZERO_TO_ONE");
  });

  it("maps known title variants to predefined options", () => {
    const result = mergeProfileExtractionSuggestionsIntoFormValues(
      {},
      {
        targetTitle: "Full Stack Developer",
        yearsOfExperience: null,
        skills: [],
        experienceSummary: null,
        portfolioUrl: null,
        githubUrl: null,
        linkedinUrl: null,
        workPreferences: [],
      },
    );

    expect(result.targetTitleOption).toBe("Full-Stack Engineer");
    expect(result.targetTitleOther).toBe("");
  });
});
