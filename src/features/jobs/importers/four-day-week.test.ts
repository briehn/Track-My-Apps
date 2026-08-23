import { readFile } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import { prepareBulkJobUrlImport } from "@/features/jobs/bulk-job-url-import-service";
import { importFourDayWeekJob } from "@/features/jobs/importers/four-day-week";
import {
  detectJobImportSource,
  type FourDayWeekJobSource,
} from "@/features/jobs/importers/job-url";
import { jobDraftSchema, jobImportSeedSchema } from "@/features/jobs/schemas";

const exampleUrl = "https://4dayweek.io/job/video-software-engineer-at-dolby-01ca96da?source=tracker#apply";

async function loadFixture() {
  const fixtureUrl = new URL("./__fixtures__/four-day-week-job.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
}

function getFourDayWeekSource(): FourDayWeekJobSource {
  const result = detectJobImportSource(exampleUrl);

  if (!result.success || result.source.kind !== "FOUR_DAY_WEEK") {
    throw new Error("Expected the 4 Day Week fixture URL to be detected.");
  }

  return result.source;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("importFourDayWeekJob", () => {
  it("uses the constrained documented endpoint and normalizes a real-shaped review seed", async () => {
    const requestedUrls: string[] = [];
    const source = getFourDayWeekSource();
    const result = await importFourDayWeekJob(source, async (url) => {
      requestedUrls.push(url.toString());
      return loadFixture();
    });

    expect(requestedUrls).toEqual([
      "https://4dayweek.io/api/v2/jobs/video-software-engineer-at-dolby-01ca96da",
    ]);
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.source).toEqual(source);
    expect(result.seed).toMatchObject({
      company: "Dolby",
      description:
        "Join the leader in entertainment innovation.\n\n- Design and develop innovative video algorithms.\n- Partner with QA to improve automation.",
      location: "Sunnyvale, California, United States",
      remoteType: "HYBRID",
      salaryCurrency: "USD",
      salaryMax: 188300,
      salaryMin: 137100,
      source: "4 Day Week",
      title: "Video Software Engineer",
      url: "https://4dayweek.io/job/video-software-engineer-at-dolby-01ca96da?source=tracker",
    });
    expect(result.seed.employmentType).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(jobImportSeedSchema.safeParse(result.seed).success).toBe(true);
    expect(jobDraftSchema.safeParse(result.seed).success).toBe(true);
  });

  it.each([
    ["remote", "REMOTE"],
    ["hybrid", "HYBRID"],
    ["onsite", "ONSITE"],
  ] as const)("maps the documented %s work arrangement", async (workArrangement, remoteType) => {
    const fixture = await loadFixture();
    const result = await importFourDayWeekJob(getFourDayWeekSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      work_arrangement: workArrangement,
    }));

    expect(result).toMatchObject({ seed: { remoteType }, success: true });
  });

  it("uses a primary location's work arrangement when the top-level value is unknown", async () => {
    const fixture = await loadFixture();
    const result = await importFourDayWeekJob(getFourDayWeekSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      work_arrangement: "flexible",
    }));

    expect(result).toMatchObject({ seed: { remoteType: "HYBRID" }, success: true });
  });

  it("maps contract while leaving permanent and unknown contract labels unset", async () => {
    const fixture = await loadFixture();
    const contractResult = await importFourDayWeekJob(getFourDayWeekSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      contract_type: "contract",
    }));
    const permanentResult = await importFourDayWeekJob(getFourDayWeekSource(), async () => fixture);
    const unknownResult = await importFourDayWeekJob(getFourDayWeekSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      contract_type: "future-label",
    }));

    expect(contractResult).toMatchObject({ seed: { employmentType: "CONTRACT" }, success: true });
    if (permanentResult.success) {
      expect(permanentResult.seed.employmentType).toBeUndefined();
    }
    if (unknownResult.success) {
      expect(unknownResult.seed.employmentType).toBeUndefined();
    }
  });

  it.each([
    {
      salary_currency: "EUR",
      salary_max: 18830000,
      salary_min: 13710000,
      salary_period: "year",
    },
    {
      salary_currency: "USD",
      salary_max: 18830050,
      salary_min: 13710000,
      salary_period: "year",
    },
    {
      salary_currency: "USD",
      salary_max: 18830000,
      salary_min: 13710000,
      salary_period: "hour",
    },
  ])("omits salary that cannot safely map to whole annual USD values", async (salary) => {
    const fixture = await loadFixture();
    const result = await importFourDayWeekJob(getFourDayWeekSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      ...salary,
    }));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed.salaryMin).toBeUndefined();
    expect(result.seed.salaryMax).toBeUndefined();
    expect(result.warnings).toContainEqual({
      code: "INVALID_BASE_SALARY",
      message: "4 Day Week salary could not be represented safely and was omitted.",
    });
  });

  it("keeps a useful review seed when optional fields are absent or malformed", async () => {
    const result = await importFourDayWeekJob(getFourDayWeekSource(), async () => ({
      company: 42,
      contract_type: 42,
      description: 42,
      locations: 42,
      title: "Support Engineer",
      url: null,
      work_arrangement: 42,
    }));

    expect(result).toMatchObject({
      seed: {
        source: "4 Day Week",
        title: "Support Engineer",
        url: "https://4dayweek.io/job/video-software-engineer-at-dolby-01ca96da?source=tracker",
      },
      success: true,
    });
  });

  it("does not let an unrelated API URL replace the submitted canonical job URL", async () => {
    const fixture = await loadFixture();
    const result = await importFourDayWeekJob(getFourDayWeekSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      url: "https://example.com/unrelated-job",
    }));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.seed.url).toBe(
        "https://4dayweek.io/job/video-software-engineer-at-dolby-01ca96da?source=tracker",
      );
      expect(result.warnings).toContainEqual({
        code: "INVALID_EXTERNAL_URL",
        message: "4 Day Week returned an unexpected job URL; the submitted URL will be used instead.",
      });
    }
  });

  it("fails safely for malformed required job data and retrieval failures", async () => {
    const malformedResult = await importFourDayWeekJob(getFourDayWeekSource(), async () => ({
      title: 42,
    }));
    const retrievalResult = await importFourDayWeekJob(getFourDayWeekSource(), async () => {
      throw new Error("timeout");
    });

    expect(malformedResult).toEqual({
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "4 Day Week returned job data in an unexpected format.",
      },
      success: false,
    });
    expect(retrievalResult).toEqual({
      error: {
        code: "EXTRACTION_FAILED",
        message: "The 4 Day Week job could not be retrieved.",
      },
      success: false,
    });
  });

  it("reports the documented per-job 404 as an unavailable posting", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "not found" }), {
        headers: { "content-type": "application/json" },
        status: 404,
      }),
    );

    const result = await importFourDayWeekJob(getFourDayWeekSource());

    expect(result).toEqual({
      error: {
        code: "POSTING_UNAVAILABLE",
        message: "This 4 Day Week job posting is no longer available.",
      },
      success: false,
    });
  });

  it.each([403, 429, 500])("returns a safe failure when the API responds with HTTP %i", async (status) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "unavailable" }), {
        headers: { "content-type": "application/json" },
        status,
      }),
    );

    const result = await importFourDayWeekJob(getFourDayWeekSource());

    expect(result).toEqual({
      error: {
        code: "EXTRACTION_FAILED",
        message: "The 4 Day Week job could not be retrieved.",
      },
      success: false,
    });
  });

  it("rejects a successful non-JSON response and oversized response before parsing", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response("<html>not JSON</html>", {
          headers: { "content-type": "text/html" },
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response("{}", {
          headers: { "content-length": "1000001", "content-type": "application/json" },
          status: 200,
        }),
      );

    const contentTypeResult = await importFourDayWeekJob(getFourDayWeekSource());
    const oversizedResult = await importFourDayWeekJob(getFourDayWeekSource());

    expect(contentTypeResult.success).toBe(false);
    expect(oversizedResult.success).toBe(false);
  });

  it("returns a safe failure for malformed API JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{ malformed }", {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );

    const result = await importFourDayWeekJob(getFourDayWeekSource());

    expect(result).toEqual({
      error: {
        code: "EXTRACTION_FAILED",
        message: "The 4 Day Week job could not be retrieved.",
      },
      success: false,
    });
  });

  it("flows through Bulk Add with its dedicated source and an eligible review seed", async () => {
    const source = getFourDayWeekSource();
    const fixture = await loadFixture();
    const result = await prepareBulkJobUrlImport(source.canonicalUrl, {
      findExistingJobs: async () => [],
      importJob: async () => importFourDayWeekJob(source, async () => fixture),
    });

    expect(result.items).toMatchObject([
      {
        seed: { company: "Dolby", source: "4 Day Week", title: "Video Software Engineer" },
        source: { kind: "FOUR_DAY_WEEK" },
        status: "success",
      },
    ]);
  });
});
