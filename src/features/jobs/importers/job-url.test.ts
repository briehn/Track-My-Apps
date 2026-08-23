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

  it("detects supported Gem URLs and preserves query parameters while removing fragments", () => {
    const result = detectJobImportSource(
      "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp?source=career_site#apply",
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.source).toEqual({
      board: "nominal",
      canonicalUrl: "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp?source=career_site",
      kind: "GEM",
      postingId: "am9icG9zdDrl9lWhYeSFOCTw_muGyNcp",
      submittedUrl: "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp?source=career_site#apply",
    });
  });

  it.each([
    "https://jobs.gem.com/nominal",
    "https://jobs.gem.com/nominal/posting/extra",
    "https://jobs.gem.com/nominal/not%20a%20posting",
  ])("rejects malformed Gem URLs instead of routing them to generic JSON-LD", (submittedUrl) => {
    expect(detectJobImportSource(submittedUrl)).toEqual({
      error: {
        code: "UNSUPPORTED_SOURCE",
        message: "This job URL source is not supported yet.",
      },
      success: false,
    });
  });

  it("detects supported Rippling URLs and preserves query parameters while removing fragments", () => {
    const result = detectJobImportSource(
      "https://ats.rippling.com/rancho-biosciences/jobs/4f28fa6c-fdd8-439e-b04d-c126648dcdfd?source=career_site#apply",
    );

    expect(result).toEqual({
      source: {
        canonicalUrl:
          "https://ats.rippling.com/rancho-biosciences/jobs/4f28fa6c-fdd8-439e-b04d-c126648dcdfd?source=career_site",
        companySlug: "rancho-biosciences",
        jobId: "4f28fa6c-fdd8-439e-b04d-c126648dcdfd",
        kind: "RIPPLING",
        submittedUrl:
          "https://ats.rippling.com/rancho-biosciences/jobs/4f28fa6c-fdd8-439e-b04d-c126648dcdfd?source=career_site#apply",
      },
      success: true,
    });
  });

  it.each([
    "https://ats.rippling.com/rancho-biosciences",
    "https://ats.rippling.com/rancho-biosciences/jobs/not-a-uuid",
    "https://ats.rippling.com/rancho-biosciences/jobs/4f28fa6c-fdd8-439e-b04d-c126648dcdfd/extra",
  ])("rejects malformed Rippling URLs instead of routing them to generic JSON-LD", (submittedUrl) => {
    expect(detectJobImportSource(submittedUrl)).toEqual({
      error: {
        code: "UNSUPPORTED_SOURCE",
        message: "This job URL source is not supported yet.",
      },
      success: false,
    });
  });

  it("routes other valid public job URLs to the JSON-LD importer", () => {
    expect(detectJobImportSource("https://jobs.example.com/openings/42#apply")).toEqual({
      source: {
        canonicalUrl: "https://jobs.example.com/openings/42",
        kind: "JSON_LD",
        submittedUrl: "https://jobs.example.com/openings/42#apply",
      },
      success: true,
    });
  });

  it("rejects embedded URL credentials before selecting an importer", () => {
    expect(detectJobImportSource("https://user:pass@jobs.example.com/openings/42")).toEqual({
      error: {
        code: "UNSAFE_URL",
        message: "This URL can't be imported.",
      },
      success: false,
    });
  });

  it("rejects literal Markdown escape backslashes without reinterpreting a Gem posting ID", () => {
    expect(
      detectJobImportSource(
        "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw\\_muGyNcp",
      ),
    ).toEqual({
      error: {
        code: "MALFORMED_URL",
        message: "Remove escaped backslashes from the job URL and paste the browser URL directly.",
      },
      success: false,
    });
  });
});
