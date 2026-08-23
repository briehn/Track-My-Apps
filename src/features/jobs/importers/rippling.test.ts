import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  importRipplingJob,
  importRipplingJobFromHtml,
} from "@/features/jobs/importers/rippling";
import {
  detectJobImportSource,
  type RipplingJobSource,
} from "@/features/jobs/importers/job-url";
import { jobDraftSchema, jobImportSeedSchema } from "@/features/jobs/schemas";

async function loadFixture() {
  const fixtureUrl = new URL("./__fixtures__/rippling-job.html", import.meta.url);
  return readFile(fixtureUrl, "utf8");
}

function getRipplingSource(): RipplingJobSource {
  const result = detectJobImportSource(
    "https://ats.rippling.com/rancho-biosciences/jobs/4f28fa6c-fdd8-439e-b04d-c126648dcdfd?source=career_site#apply",
  );

  if (!result.success || result.source.kind !== "RIPPLING") {
    throw new Error("Expected the Rippling fixture URL to be detected.");
  }

  return result.source;
}

function withNextData(jobPost: Record<string, unknown>) {
  return `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { apiData: { jobPost } } },
  })}</script>`;
}

function fixtureJobPost(overrides: Record<string, unknown> = {}) {
  return {
    companyName: "Rancho BioSciences, LLC",
    description: {
      company: "<p>Company introduction.</p>",
      role: "<p>Build reliable systems.</p>",
    },
    employmentType: { id: "Salaried, full-time", label: "SALARIED_FT" },
    name: "Associate/Consultant Engineer",
    payRangeDetails: [],
    url: "https://ats.rippling.com/rancho-biosciences/jobs/4f28fa6c-fdd8-439e-b04d-c126648dcdfd",
    workLocations: ["Remote"],
    ...overrides,
  };
}

describe("importRipplingJob", () => {
  it("fetches only the canonical hosted page and normalizes real-shaped Next data", async () => {
    const requestedUrls: string[] = [];
    const source = getRipplingSource();
    const result = await importRipplingJob(source, async (url) => {
      requestedUrls.push(url.toString());
      return { finalUrl: url, html: await loadFixture() };
    });

    expect(requestedUrls).toEqual([source.canonicalUrl]);
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.source).toEqual(source);
    expect(result.seed).toMatchObject({
      company: "Rancho BioSciences, LLC",
      description:
        "Rancho BioSciences delivers life-science data solutions.\n\nBuild reliable enterprise systems.\n\n- Collaborate with scientists\n- Ship improvements",
      employmentType: "FULL_TIME",
      location: "Remote",
      remoteType: "REMOTE",
      source: "Rippling",
      title: "Associate/Consultant Engineer",
      url: source.canonicalUrl,
    });
    expect(result.seed.salaryMin).toBeUndefined();
    expect(result.seed.salaryMax).toBeUndefined();
    expect(jobImportSeedSchema.safeParse(result.seed).success).toBe(true);
    expect(jobDraftSchema.safeParse(result.seed).success).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("ignores unrelated fields in the Next data payload", () => {
    const result = importRipplingJobFromHtml(
      getRipplingSource(),
      withNextData({
        ...fixtureJobPost(),
        anotherUnknownField: { nested: ["future", "data"] },
      }),
    );

    expect(result).toMatchObject({
      seed: { company: "Rancho BioSciences, LLC", title: "Associate/Consultant Engineer" },
      success: true,
    });
  });

  it.each([
    [["Remote (United States)"], "REMOTE"],
    [["New York, NY (Hybrid)"], "HYBRID"],
    [["New York, NY"], undefined],
  ] as const)("derives work mode only from reliable structured locations", (workLocations, remoteType) => {
    const result = importRipplingJobFromHtml(
      getRipplingSource(),
      withNextData(fixtureJobPost({ workLocations })),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.seed.remoteType).toBe(remoteType);
    }
  });

  it("joins multiple structured locations deterministically", () => {
    const result = importRipplingJobFromHtml(
      getRipplingSource(),
      withNextData(fixtureJobPost({ workLocations: ["Remote", "New York, NY", "Remote"] })),
    );

    expect(result).toMatchObject({ seed: { location: "Remote / New York, NY" }, success: true });
  });

  it("uses an employment label when the preferred employment identifier is unknown", () => {
    const result = importRipplingJobFromHtml(
      getRipplingSource(),
      withNextData(
        fixtureJobPost({ employmentType: { id: "future-contract", label: "Part time" } }),
      ),
    );

    expect(result).toMatchObject({ seed: { employmentType: "PART_TIME" }, success: true });
  });

  it("leaves unknown optional employment, work mode, and malformed optional data unset", () => {
    const result = importRipplingJobFromHtml(
      getRipplingSource(),
      withNextData(
        fixtureJobPost({
          description: 42,
          employmentType: { id: "future-contract", label: "consultantish" },
          payRangeDetails: { unexpected: true },
          workLocations: [42],
        }),
      ),
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed.description).toBeUndefined();
    expect(result.seed.employmentType).toBeUndefined();
    expect(result.seed.location).toBeUndefined();
    expect(result.seed.remoteType).toBeUndefined();
    expect(result.seed.salaryMin).toBeUndefined();
  });

  it("maps one compatible explicit annual salary range without annualizing other periods", () => {
    const result = importRipplingJobFromHtml(
      getRipplingSource(),
      withNextData(
        fixtureJobPost({
          payRangeDetails: [
            { currency: "usd", frequency: "YEARLY", rangeEnd: 150000, rangeStart: 120000 },
          ],
        }),
      ),
    );

    expect(result).toMatchObject({
      seed: { salaryCurrency: "USD", salaryMax: 150000, salaryMin: 120000 },
      success: true,
    });
  });

  it.each([
    [
      [{ currency: "USD", frequency: "HOURLY", rangeEnd: 75, rangeStart: 50 }],
    ],
    [
      [{ currency: "USD", frequency: "YEARLY", rangeEnd: 100000, rangeStart: 120000 }],
    ],
    [
      [
        { currency: "USD", frequency: "YEARLY", rangeEnd: 150000, rangeStart: 120000 },
        { currency: "USD", frequency: "YEARLY", rangeEnd: 130000, rangeStart: 100000 },
      ],
    ],
  ])("omits incompatible or ambiguous salary ranges", (payRangeDetails) => {
    const result = importRipplingJobFromHtml(
      getRipplingSource(),
      withNextData(fixtureJobPost({ payRangeDetails })),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.seed.salaryMin).toBeUndefined();
      expect(result.seed.salaryMax).toBeUndefined();
      expect(result.seed.salaryCurrency).toBeUndefined();
    }
  });

  it("uses conservative editable company inference only when authoritative company data is absent", () => {
    const result = importRipplingJobFromHtml(
      getRipplingSource(),
      withNextData(fixtureJobPost({ companyName: null })),
    );

    expect(result).toMatchObject({ seed: { company: "Rancho Biosciences" }, success: true });
    if (result.success) {
      expect(result.warnings).toContainEqual({
        code: "INFERRED_COMPANY",
        message: "Company was inferred from the Rippling company slug. Verify it before saving.",
      });
    }
  });

  it("does not let an unrelated structured URL replace the submitted canonical job URL", () => {
    const result = importRipplingJobFromHtml(
      getRipplingSource(),
      withNextData(fixtureJobPost({ url: "https://example.com/unrelated-job" })),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.seed.url).toBe(getRipplingSource().canonicalUrl);
      expect(result.warnings).toContainEqual({
        code: "INVALID_EXTERNAL_URL",
        message: "Rippling returned an unexpected job URL; the submitted URL will be used instead.",
      });
    }
  });

  it.each([
    ["missing Next data", "<main>Job details</main>", "Rippling did not include the expected job data."],
    [
      "malformed Next data JSON",
      '<script id="__NEXT_DATA__" type="application/json">{ malformed }</script>',
      "Rippling returned malformed job data.",
    ],
    [
      "missing job post",
      '<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"apiData":{}}}}</script>',
      "Rippling returned job data in an unexpected format.",
    ],
    [
      "malformed required title",
      withNextData(fixtureJobPost({ name: 42 })),
      "Rippling returned job data in an unexpected format.",
    ],
  ])("fails safely for %s", (_scenario, html, message) => {
    expect(importRipplingJobFromHtml(getRipplingSource(), html)).toEqual({
      error: { code: "MALFORMED_EXTERNAL_DATA", message },
      success: false,
    });
  });

  it("returns a safe retrieval failure when the canonical hosted page cannot be fetched", async () => {
    const result = await importRipplingJob(getRipplingSource(), async () => {
      throw new Error("timeout");
    });

    expect(result).toEqual({
      error: { code: "EXTRACTION_FAILED", message: "The Rippling job could not be retrieved." },
      success: false,
    });
  });
});
