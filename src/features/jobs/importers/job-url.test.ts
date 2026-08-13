import { describe, expect, it } from "vitest";

import { detectJobImportSource } from "@/features/jobs/importers/job-url";

describe("detectJobImportSource", () => {
  it.each([
    "https://boards.greenhouse.io/acmelabs/jobs/44444?gh_src=career_site#apply",
    "http://job-boards.greenhouse.io/acmelabs/jobs/44444?source=tracker#details",
  ])("detects supported Greenhouse URLs and removes only fragments", (submittedUrl) => {
    const result = detectJobImportSource(submittedUrl);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.source).toMatchObject({
      boardToken: "acmelabs",
      jobId: "44444",
      kind: "GREENHOUSE",
    });
    expect(result.source.canonicalUrl).not.toContain("#");
    expect(result.source.canonicalUrl).toContain("?");
  });

  it("rejects non-HTTP(S) URLs", () => {
    expect(detectJobImportSource("javascript:alert(1)")).toEqual({
      error: {
        code: "INVALID_URL",
        message: "Enter a valid http:// or https:// job URL.",
      },
      success: false,
    });
  });

  it("reports valid but unsupported URLs distinctly", () => {
    expect(detectJobImportSource("https://jobs.example.com/openings/42")).toEqual({
      error: {
        code: "UNSUPPORTED_SOURCE",
        message: "This job URL source is not supported yet.",
      },
      success: false,
    });
  });
});
