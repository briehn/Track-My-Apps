import { describe, expect, it } from "vitest";

import {
  JOB_URL_IMPORT_CONCURRENCY,
  JOB_URL_IMPORT_MAX_BATCH_SIZE,
  mapWithConcurrency,
  parseBulkJobUrls,
} from "@/features/jobs/bulk-job-url-import";
import {
  prepareBulkJobUrlImport,
  saveBulkJobUrlImports,
} from "@/features/jobs/bulk-job-url-import-service";
import type { DetectedJobImportSource } from "@/features/jobs/importers/job-url";
import type { JobImportResult } from "@/features/jobs/importers/types";

function createImportedJobSource(url: string): DetectedJobImportSource {
  if (url.includes("greenhouse")) {
    return {
      boardToken: "board",
      canonicalUrl: url,
      jobId: "1",
      kind: "GREENHOUSE",
      submittedUrl: url,
    };
  }

  if (url.includes("lever")) {
    return {
      canonicalUrl: url,
      instance: "GLOBAL",
      kind: "LEVER",
      postingId: "id",
      site: "site",
      submittedUrl: url,
    };
  }

  return {
    canonicalUrl: url,
    kind: "JSON_LD",
    submittedUrl: url,
  };
}

describe("parseBulkJobUrls", () => {
  it("trims URLs, ignores blank lines, and preserves submitted order", () => {
    expect(
      parseBulkJobUrls("\n https://example.com/one \n\r\nhttps://example.com/two\n"),
    ).toEqual({
      entries: [
        { lineNumber: 2, submittedUrl: "https://example.com/one" },
        { lineNumber: 4, submittedUrl: "https://example.com/two" },
      ],
      ignoredBlankLineCount: 3,
    });
  });

  it("exports a deliberately small batch limit", () => {
    expect(JOB_URL_IMPORT_MAX_BATCH_SIZE).toBe(20);
  });
});

describe("mapWithConcurrency", () => {
  it("keeps results in input order while limiting active work", async () => {
    let active = 0;
    let maximumActive = 0;

    const result = await mapWithConcurrency([1, 2, 3, 4, 5], JOB_URL_IMPORT_CONCURRENCY, async (value) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, value === 1 ? 15 : 1));
      active -= 1;
      return value * 2;
    });

    expect(result).toEqual([2, 4, 6, 8, 10]);
    expect(maximumActive).toBeLessThanOrEqual(JOB_URL_IMPORT_CONCURRENCY);
  });
});

describe("prepareBulkJobUrlImport", () => {
  it("isolates malformed URLs and preserves mixed adapter results", async () => {
    const result = await prepareBulkJobUrlImport("https://greenhouse.example/job\nnot-a-url\nhttps://lever.example/job\nhttps://jsonld.example/job", {
      findExistingJobs: async () => [],
      importJob: async (url): Promise<JobImportResult> => {
        if (url === "not-a-url") {
          return {
            error: { code: "INVALID_URL", message: "ignored" },
            success: false as const,
          };
        }

        return {
          seed: {
            company: url.includes("greenhouse") ? "Greenhouse Co" : url.includes("lever") ? "Lever Co" : "JSON-LD Co",
            title: "Engineer",
            url,
          },
          source: createImportedJobSource(url),
          success: true as const,
          warnings: [],
        };
      },
    });

    expect(result.items.map((item) => item.status)).toEqual(["success", "failure", "success", "success"]);
    expect(result.items[1]).toMatchObject({
      message: "Enter a valid http:// or https:// job URL.",
      submittedUrl: "not-a-url",
    });
  });

  it("keeps unavailable postings separate from import failures and out of duplicate review", async () => {
    const result = await prepareBulkJobUrlImport(
      "https://job-boards.greenhouse.io/66degrees/jobs/6135129004\nnot-a-url",
      {
        findExistingJobs: async () => [],
        importJob: async (url): Promise<JobImportResult> => {
          if (url.includes("greenhouse")) {
            return {
              error: {
                code: "POSTING_UNAVAILABLE",
                message: "This Greenhouse job posting is no longer available.",
              },
              success: false,
            };
          }

          return {
            error: { code: "INVALID_URL", message: "ignored" },
            success: false,
          };
        },
      },
    );

    expect(result.items).toEqual([
      {
        lineNumber: 1,
        message: "This job posting is no longer available. You can still enter the job manually if you previously applied to it.",
        status: "unavailable",
        submittedUrl: "https://job-boards.greenhouse.io/66degrees/jobs/6135129004",
      },
      {
        lineNumber: 2,
        message: "Enter a valid http:// or https:// job URL.",
        status: "failure",
        submittedUrl: "not-a-url",
      },
    ]);
  });

  it("checks saved jobs through the supplied user-scoped candidate list", async () => {
    const requestedExistingJobs: string[] = [];
    const result = await prepareBulkJobUrlImport("https://example.com/jobs/1", {
      findExistingJobs: async () => {
        requestedExistingJobs.push("current-user-only");
        return [{ company: "Acme", id: "existing-job", title: "Engineer", url: "https://example.com/jobs/1" }];
      },
      importJob: async (url) => ({
        seed: { company: "Acme", title: "Engineer", url },
        source: { canonicalUrl: url, kind: "JSON_LD", submittedUrl: url },
        success: true,
        warnings: [],
      }),
    });

    expect(requestedExistingJobs).toEqual(["current-user-only"]);
    expect(result.items[0]).toMatchObject({ duplicate: { jobId: "existing-job", reason: "URL" } });
  });

  it("flags later canonical URL duplicates within a batch", async () => {
    const result = await prepareBulkJobUrlImport("https://example.com/jobs/1#first\nhttps://example.com/jobs/1", {
      findExistingJobs: async () => [],
      importJob: async (url) => ({
        seed: { company: "Acme", title: "Engineer", url: "https://example.com/jobs/1" },
        source: { canonicalUrl: url, kind: "JSON_LD", submittedUrl: url },
        success: true,
        warnings: [],
      }),
    });

    expect(result.items[1]).toMatchObject({ batchDuplicateOfLineNumber: 1 });
  });
});

describe("saveBulkJobUrlImports", () => {
  it("validates each selected job and allows independent successful saves", async () => {
    const savedTitles: string[] = [];
    const results = await saveBulkJobUrlImports(
      [
        { reviewId: "valid", draft: { company: "Acme", title: "Engineer" } },
        { reviewId: "invalid", draft: { company: "", title: "Engineer" } },
        { reviewId: "database-failure", draft: { company: "Beta", title: "Designer" } },
      ],
      async (input) => {
        if (input.company === "Beta") throw new Error("database unavailable");
        savedTitles.push(input.title);
      },
    );

    expect(savedTitles).toEqual(["Engineer"]);
    expect(results).toEqual([
      { reviewId: "valid", status: "saved" },
      expect.objectContaining({ reviewId: "invalid", status: "failure" }),
      expect.objectContaining({ reviewId: "database-failure", status: "failure" }),
    ]);
  });
});
