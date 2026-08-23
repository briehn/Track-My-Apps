import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import {
  importLeverJob,
  LeverApiNotFoundError,
} from "@/features/jobs/importers/lever";
import { detectJobImportSource } from "@/features/jobs/importers/job-url";
import { jobDraftSchema, jobImportSeedSchema } from "@/features/jobs/schemas";

async function loadFixture() {
  const fixtureUrl = new URL("./__fixtures__/lever-job.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
}

async function loadOnsiteFixture() {
  const fixtureUrl = new URL("./__fixtures__/lever-job-onsite.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
}

async function loadHostedJsonLdFixture() {
  const fixtureUrl = new URL("./__fixtures__/lever-hosted-job.json-ld.html", import.meta.url);
  return readFile(fixtureUrl, "utf8");
}

function getLeverSource() {
  const result = detectJobImportSource(
    "https://jobs.lever.co/acme/9b4bbf16-2cd5-4a29-bfef-3fc72aa0243f?lever-origin=apply#apply",
  );

  if (!result.success || result.source.kind !== "LEVER") {
    throw new Error("Expected the Lever fixture URL to be detected.");
  }

  return result.source;
}

function getSalvoHealthSource() {
  const result = detectJobImportSource(
    "https://jobs.lever.co/salvohealth/285d6b09-7961-490b-8927-3b24698affe9",
  );

  if (!result.success || result.source.kind !== "LEVER") {
    throw new Error("Expected the SalvoHealth URL to be detected as Lever.");
  }

  return result.source;
}

describe("importLeverJob", () => {
  it("normalizes a realistic Lever response into a review seed with a warned company suggestion", async () => {
    const requestedUrls: string[] = [];
    const hostedFetch = vi.fn(async () => {
      throw new Error("The hosted fallback must not run after a successful API response.");
    });
    const result = await importLeverJob(
      getLeverSource(),
      async (url) => {
        requestedUrls.push(url.toString());
        return loadFixture();
      },
      hostedFetch,
    );

    expect(requestedUrls).toEqual([
      "https://api.lever.co/v0/postings/acme/9b4bbf16-2cd5-4a29-bfef-3fc72aa0243f",
    ]);
    expect(hostedFetch).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed).toMatchObject({
      company: "Acme",
      description: "Build reliable systems for customers.\n\nYou will work with a collaborative platform team.",
      employmentType: "FULL_TIME",
      location: "Remote, United States",
      remoteType: "REMOTE",
      salaryCurrency: "USD",
      salaryMax: 195000,
      salaryMin: 160000,
      source: "Lever",
      title: "Senior Platform Engineer",
      url: "https://jobs.lever.co/acme/9b4bbf16-2cd5-4a29-bfef-3fc72aa0243f?lever-origin=apply",
    });
    expect(jobDraftSchema.safeParse(result.seed).success).toBe(true);
    expect(result.warnings).toEqual([
      {
        code: "INFERRED_COMPANY",
        message: "Company was inferred from the Lever site identifier. Verify it before saving.",
      },
    ]);
  });

  it("handles missing optional Lever fields without preventing review", async () => {
    const result = await importLeverJob(getLeverSource(), async () => ({
      text: "Support Engineer",
    }));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed).toEqual({
      company: "Acme",
      source: "Lever",
      title: "Support Engineer",
      url: "https://jobs.lever.co/acme/9b4bbf16-2cd5-4a29-bfef-3fc72aa0243f?lever-origin=apply",
    });
    expect(result.warnings).toEqual([
      {
        code: "INFERRED_COMPANY",
        message: "Company was inferred from the Lever site identifier. Verify it before saving.",
      },
    ]);
  });

  it("falls back to the submitted Lever hosted URL only after an API 404", async () => {
    const source = getSalvoHealthSource();
    const requestedApiUrls: string[] = [];
    const requestedHostedUrls: string[] = [];
    const result = await importLeverJob(
      source,
      async (url) => {
        requestedApiUrls.push(url.toString());
        throw new LeverApiNotFoundError();
      },
      async (url) => {
        requestedHostedUrls.push(url.toString());
        return { finalUrl: new URL(url), html: await loadHostedJsonLdFixture() };
      },
    );

    expect(requestedApiUrls).toEqual([
      "https://api.lever.co/v0/postings/salvohealth/285d6b09-7961-490b-8927-3b24698affe9",
    ]);
    expect(requestedHostedUrls).toEqual([source.canonicalUrl]);
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.source).toEqual(source);
    expect(result.seed).toMatchObject({
      company: "Salvohealth",
      description: "Build accessible healthcare software with a collaborative remote team.",
      employmentType: "FULL_TIME",
      location: "New York, NY",
      source: "Lever",
      title: "Junior Software Engineer",
      url: source.canonicalUrl,
    });
    expect(result.seed.salaryMin).toBeUndefined();
    expect(result.seed.salaryMax).toBeUndefined();
    expect(jobImportSeedSchema.safeParse(result.seed).success).toBe(true);
    expect(jobDraftSchema.safeParse(result.seed).success).toBe(true);
    expect(result.warnings).toEqual([
      {
        code: "INFERRED_COMPANY",
        message: "Company was inferred from the Lever site identifier. Verify it before saving.",
      },
    ]);
  });

  it.each([
    ["403 response", new Error("Lever returned 403.")],
    ["429 response", new Error("Lever returned 429.")],
    ["5xx response", new Error("Lever returned 503.")],
    ["timeout", new Error("The operation was aborted due to timeout.")],
    ["retrieval failure", new Error("Network connection failed.")],
  ])("does not use hosted JSON-LD fallback after a %s", async (_scenario, apiError) => {
    const fetchHostedHtml = vi.fn();
    const result = await importLeverJob(
      getLeverSource(),
      async () => {
        throw apiError;
      },
      fetchHostedHtml,
    );

    expect(fetchHostedHtml).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: {
        code: "EXTRACTION_FAILED",
        message: "The Lever job could not be retrieved.",
      },
      success: false,
    });
  });

  it("returns a safe failure when the hosted JSON-LD is malformed", async () => {
    const result = await importLeverJob(
      getLeverSource(),
      async () => {
        throw new LeverApiNotFoundError();
      },
      async (url) => ({
        finalUrl: new URL(url),
        html: '<script type="application/ld+json">{ malformed }</script>',
      }),
    );

    expect(result).toEqual({
      error: {
        code: "UNSUPPORTED_SOURCE",
        message: "No supported structured job data was found on this page.",
      },
      success: false,
    });
  });

  it("accepts the additional salaryRange.interval field returned by Lever", async () => {
    const fixture = await loadFixture();
    const result = await importLeverJob(getLeverSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      salaryRange: {
        currency: "USD",
        interval: "per-year-salary",
        max: 195000,
        min: 160000,
      },
    }));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed).toMatchObject({
      salaryCurrency: "USD",
      salaryMax: 195000,
      salaryMin: 160000,
    });
  });

  it("accepts Lever's real-world onsite workplace type variant", async () => {
    const sourceResult = detectJobImportSource(
      "https://jobs.lever.co/flowlife/3c9b5522-539b-4924-b141-e824f64de126",
    );

    if (!sourceResult.success || sourceResult.source.kind !== "LEVER") {
      throw new Error("Expected the FlowLife URL to be detected as Lever.");
    }

    const result = await importLeverJob(sourceResult.source, loadOnsiteFixture);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed).toMatchObject({
      company: "Flowlife",
      employmentType: "FULL_TIME",
      location: "Bay Harbor Islands, FL",
      remoteType: "ONSITE",
      source: "Lever",
      title: "Design Project Manager (Architect/Interior Designer)",
      url: "https://jobs.lever.co/flowlife/3c9b5522-539b-4924-b141-e824f64de126",
    });
    expect(result.warnings).toContainEqual({
      code: "INFERRED_COMPANY",
      message: "Company was inferred from the Lever site identifier. Verify it before saving.",
    });
  });

  it("uses safe HTML-to-text normalization only when Lever plain text is unavailable", async () => {
    const result = await importLeverJob(getLeverSource(), async () => ({
      description: "<p>Build <strong>reliable</strong> systems.</p><ul><li>Ship improvements</li></ul>",
      text: "Platform Engineer",
      workplaceType: "hybrid",
    }));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed.description).toBe("Build reliable systems.\n\n- Ship improvements");
    expect(result.seed.remoteType).toBe("HYBRID");
  });

  it("reports malformed required Lever data without creating a seed", async () => {
    const result = await importLeverJob(getLeverSource(), async () => ({ text: 42 }));

    expect(result).toEqual({
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Lever returned job data in an unexpected format.",
      },
      success: false,
    });
  });
});
