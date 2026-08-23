import { readFile } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import { importGemJob } from "@/features/jobs/importers/gem";
import {
  detectJobImportSource,
  type GemJobSource,
} from "@/features/jobs/importers/job-url";
import { jobDraftSchema, jobImportSeedSchema } from "@/features/jobs/schemas";

async function loadFixture() {
  const fixtureUrl = new URL("./__fixtures__/gem-job.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
}

function getGemSource(): GemJobSource {
  const result = detectJobImportSource(
    "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp?source=career_site#apply",
  );

  if (!result.success || result.source.kind !== "GEM") {
    throw new Error("Expected the Gem fixture URL to be detected.");
  }

  return result.source;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("importGemJob", () => {
  it("normalizes a real-shaped Gem response into a validated review seed", async () => {
    const requestedUrls: string[] = [];
    const source = getGemSource();
    const result = await importGemJob(source, async (url) => {
      requestedUrls.push(url.toString());
      return loadFixture();
    });

    expect(requestedUrls).toEqual([
      "https://api.gem.com/job_board/v0/nominal/job_posts/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp",
    ]);
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.source).toEqual(source);
    expect(result.seed).toMatchObject({
      company: "Nominal",
      description: "About Nominal\nNominal builds the connected test and operations platform for advanced hardware systems.\nAbout the role\nOwn technical problems end-to-end.\nWork directly with engineers.",
      employmentType: "FULL_TIME",
      location: "New York, United States",
      remoteType: "ONSITE",
      source: "Gem",
      title: "Product Support Engineer",
      url: "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp?source=career_site",
    });
    expect(result.seed.salaryMin).toBeUndefined();
    expect(result.seed.salaryMax).toBeUndefined();
    expect(jobImportSeedSchema.safeParse(result.seed).success).toBe(true);
    expect(jobDraftSchema.safeParse(result.seed).success).toBe(true);
    expect(result.warnings).toEqual([
      {
        code: "INFERRED_COMPANY",
        message: "Company was inferred from the Gem board identifier. Verify it before saving.",
      },
    ]);
  });

  it("uses normalized HTML content when content_plain is absent", async () => {
    const fixture = await loadFixture();
    const result = await importGemJob(getGemSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      content_plain: null,
    }));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed.description).toBe(
      "About Nominal\n\nNominal builds the connected test and operations platform for advanced hardware systems.\n\nAbout the role\n\n- Own technical problems end-to-end.\n- Work directly with engineers.",
    );
  });

  it.each([
    ["remote", "REMOTE"],
    ["hybrid", "HYBRID"],
    ["in_office", "ONSITE"],
    ["on_site", "ONSITE"],
  ] as const)("maps the supported Gem location_type %s", async (locationType, remoteType) => {
    const fixture = await loadFixture();
    const result = await importGemJob(getGemSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      location_type: locationType,
    }));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.seed.remoteType).toBe(remoteType);
    }
  });

  it("leaves unknown optional fields unset and keeps the import reviewable", async () => {
    const fixture = await loadFixture();
    const result = await importGemJob(getGemSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      content: 42,
      content_plain: 42,
      employment_type: "consultantish",
      location: { name: 42 },
      location_type: "flexible",
    }));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed.description).toBeUndefined();
    expect(result.seed.employmentType).toBeUndefined();
    expect(result.seed.location).toBeUndefined();
    expect(result.seed.remoteType).toBeUndefined();
  });

  it("keeps useful imports working when Gem omits optional fields", async () => {
    const result = await importGemJob(getGemSource(), async () => ({
      title: "Support Engineer",
    }));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed).toMatchObject({
      company: "Nominal",
      source: "Gem",
      title: "Support Engineer",
      url: "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp?source=career_site",
    });
  });

  it("falls back to the submitted canonical URL when Gem returns an unexpected URL", async () => {
    const fixture = await loadFixture();
    const result = await importGemJob(getGemSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      absolute_url: "https://jobs.gem.com/other-board/other-posting",
    }));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed.url).toBe(
      "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp?source=career_site",
    );
    expect(result.warnings).toContainEqual({
      code: "INVALID_EXTERNAL_URL",
      message: "Gem returned an unexpected job URL; the submitted URL will be used instead.",
    });
  });

  it("reports malformed required Gem data without creating a seed", async () => {
    const result = await importGemJob(getGemSource(), async () => ({ title: 42 }));

    expect(result).toEqual({
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Gem returned job data in an unexpected format.",
      },
      success: false,
    });
  });

  it.each([400, 500])("returns a safe failure when Gem responds with HTTP %i", async (status) => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "unavailable" }), {
        headers: { "content-type": "application/json" },
        status,
      }),
    );
    const result = await importGemJob(getGemSource());

    expect(fetchMock.mock.calls[0]?.[0].toString()).toBe(
      "https://api.gem.com/job_board/v0/nominal/job_posts/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp",
    );
    expect(result).toEqual({
      error: {
        code: "EXTRACTION_FAILED",
        message: "The Gem job could not be retrieved.",
      },
      success: false,
    });
  });

  it("rejects a successful non-JSON Gem API response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>not JSON</html>", {
        headers: { "content-type": "text/html" },
        status: 200,
      }),
    );

    const result = await importGemJob(getGemSource());

    expect(result).toEqual({
      error: {
        code: "EXTRACTION_FAILED",
        message: "The Gem job could not be retrieved.",
      },
      success: false,
    });
  });
});
