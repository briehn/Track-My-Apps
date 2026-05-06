import { describe, expect, it } from "vitest";

import {
  getProfileFormFieldErrors,
  normalizeSkillsInput,
  profileFormInputSchema,
  profileFormSchema,
} from "@/features/profiles/schemas";

describe("normalizeSkillsInput", () => {
  it("splits on commas and newlines, trims entries, and dedupes case-insensitively", () => {
    expect(
      normalizeSkillsInput(" TypeScript, React\nNode.js\r\nreact\n\nTypeScript, SQL "),
    ).toEqual(["TypeScript", "React", "Node.js", "SQL"]);
  });

  it("returns an empty list for missing or blank input", () => {
    expect(normalizeSkillsInput(undefined)).toEqual([]);
    expect(normalizeSkillsInput(null)).toEqual([]);
    expect(normalizeSkillsInput("  \n , ")).toEqual([]);
  });
});

describe("profileFormSchema", () => {
  it("accepts valid input and normalizes optional blanks to undefined", () => {
    const result = profileFormSchema.parse({
      targetTitleOption: "Frontend Engineer",
      targetTitleOther: "   ",
      locationPreference: "   ",
      workPreferences: ["REMOTE", "HYBRID", "REMOTE"],
      yearsOfExperience: "THREE_TO_FIVE",
      skills: " React, TypeScript \nAccessibility\nreact ",
      experienceSummary: "\t",
      resumeText: "  Built internal tools at scale.  ",
      portfolioUrl: "   ",
      githubUrl: "https://github.com/example",
      linkedinUrl: "https://www.linkedin.com/in/example",
    });

    expect(result).toMatchObject({
      targetTitle: "Frontend Engineer",
      locationPreference: undefined,
      workPreferences: ["REMOTE", "HYBRID"],
      yearsOfExperience: "THREE_TO_FIVE",
      skills: ["React", "TypeScript", "Accessibility"],
      experienceSummary: undefined,
      resumeText: "Built internal tools at scale.",
      portfolioUrl: undefined,
      githubUrl: "https://github.com/example",
      linkedinUrl: "https://www.linkedin.com/in/example",
    });
  });

  it("requires a custom title when Other is selected", () => {
    const result = profileFormInputSchema.safeParse({
      targetTitleOption: "OTHER",
      skills: "TypeScript",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(getProfileFormFieldErrors(result.error).targetTitleOther).toContain(
      "Enter your target title.",
    );
  });

  it("accepts missing targetTitleOther when a predefined title is selected", () => {
    const result = profileFormInputSchema.safeParse({
      targetTitleOption: "Software Engineer",
      locationPreference: "Remote within current country",
      workPreferences: ["REMOTE"],
      yearsOfExperience: "THREE_TO_FIVE",
      skills: "TypeScript",
      experienceSummary: "",
      resumeText: "",
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid urls and unsupported experience values", () => {
    const result = profileFormInputSchema.safeParse({
      targetTitleOption: "Software Engineer",
      yearsOfExperience: "7",
      workPreferences: ["REMOTE"],
      skills: "TypeScript",
      portfolioUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.yearsOfExperience).toBeDefined();
    expect(result.error.flatten().fieldErrors.portfolioUrl).toContain(
      "Enter a valid URL.",
    );
  });
});
