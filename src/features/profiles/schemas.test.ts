import { describe, expect, it } from "vitest";

import { normalizeSkillsInput, profileSchema } from "@/features/profiles/schemas";

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

describe("profileSchema", () => {
  it("accepts valid input and normalizes optional blanks to undefined", () => {
    const result = profileSchema.parse({
      targetTitle: "  Senior Frontend Engineer  ",
      locationPreference: "   ",
      workPreference: "REMOTE",
      yearsOfExperience: "7",
      skills: " React, TypeScript \nAccessibility\nreact ",
      experienceSummary: "\t",
      resumeText: "  Built internal tools at scale.  ",
      portfolioUrl: "   ",
      githubUrl: "https://github.com/example",
      linkedinUrl: "https://www.linkedin.com/in/example",
    });

    expect(result).toMatchObject({
      targetTitle: "Senior Frontend Engineer",
      locationPreference: undefined,
      workPreference: "REMOTE",
      yearsOfExperience: 7,
      skills: ["React", "TypeScript", "Accessibility"],
      experienceSummary: undefined,
      resumeText: "Built internal tools at scale.",
      portfolioUrl: undefined,
      githubUrl: "https://github.com/example",
      linkedinUrl: "https://www.linkedin.com/in/example",
    });
  });

  it("rejects invalid urls and negative experience values", () => {
    const result = profileSchema.safeParse({
      yearsOfExperience: "-1",
      skills: "TypeScript",
      portfolioUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.yearsOfExperience).toContain(
      "Enter 0 or more years.",
    );
    expect(result.error.flatten().fieldErrors.portfolioUrl).toContain(
      "Enter a valid URL.",
    );
  });
});
