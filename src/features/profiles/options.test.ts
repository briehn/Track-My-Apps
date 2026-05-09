import { describe, expect, it } from "vitest";

import { normalizeTargetTitleToPredefinedOption } from "@/features/profiles/options";

describe("normalizeTargetTitleToPredefinedOption", () => {
  it("maps Full Stack Developer to Full-Stack Engineer", () => {
    expect(normalizeTargetTitleToPredefinedOption("Full Stack Developer")).toBe(
      "Full-Stack Engineer",
    );
  });

  it("maps Fullstack Developer to Full-Stack Engineer", () => {
    expect(normalizeTargetTitleToPredefinedOption("Fullstack Developer")).toBe(
      "Full-Stack Engineer",
    );
  });

  it("returns null for unknown titles so caller can use Other/custom", () => {
    expect(normalizeTargetTitleToPredefinedOption("Cloud Solutions Architect")).toBe(
      null,
    );
  });

  it("maps Front End and Frontend variants to Frontend Engineer", () => {
    expect(normalizeTargetTitleToPredefinedOption("Front End Developer")).toBe(
      "Frontend Engineer",
    );
    expect(normalizeTargetTitleToPredefinedOption("Frontend Developer")).toBe(
      "Frontend Engineer",
    );
  });

  it("maps Back End and Backend variants to Backend Engineer", () => {
    expect(normalizeTargetTitleToPredefinedOption("Back End Developer")).toBe(
      "Backend Engineer",
    );
    expect(normalizeTargetTitleToPredefinedOption("Backend Developer")).toBe(
      "Backend Engineer",
    );
  });
});
