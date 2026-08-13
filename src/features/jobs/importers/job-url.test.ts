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

  it.each([
    ["https://jobs.lever.co/acme/9b4bbf16-2cd5-4a29-bfef-3fc72aa0243f?lever-origin=apply#apply", "GLOBAL"],
    ["https://jobs.eu.lever.co/acme/9b4bbf16-2cd5-4a29-bfef-3fc72aa0243f", "EU"],
  ] as const)("detects supported Lever %s URLs", (submittedUrl, instance) => {
    const result = detectJobImportSource(submittedUrl);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.source).toMatchObject({
      instance,
      kind: "LEVER",
      postingId: "9b4bbf16-2cd5-4a29-bfef-3fc72aa0243f",
      site: "acme",
    });
    expect(result.source.canonicalUrl).not.toContain("#");
  });

  it("leaves incomplete Lever URLs unsupported", () => {
    expect(detectJobImportSource("https://jobs.lever.co/acme")).toEqual({
      error: {
        code: "UNSUPPORTED_SOURCE",
        message: "This job URL source is not supported yet.",
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
