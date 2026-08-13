import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { importJsonLdJob } from "@/features/jobs/importers/json-ld";
import { detectJobImportSource } from "@/features/jobs/importers/job-url";
import { jobImportSeedSchema } from "@/features/jobs/schemas";

async function loadFixture() {
  const fixtureUrl = new URL("./__fixtures__/json-ld-job.html", import.meta.url);
  return readFile(fixtureUrl, "utf8");
}

function getJsonLdSource() {
  const result = detectJobImportSource("https://careers.example.com/jobs/platform-engineer?source=tracker#apply");
  if (!result.success || result.source.kind !== "JSON_LD") {
    throw new Error("Expected the fixture URL to use the JSON-LD importer.");
  }
  return result.source;
}

function fixtureFetcher(html: string) {
  return async (url: URL) => ({ finalUrl: url, html });
}

describe("importJsonLdJob", () => {
  it("normalizes a JobPosting fixture into a validated review seed", async () => {
    const result = await importJsonLdJob(getJsonLdSource(), fixtureFetcher(await loadFixture()));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.seed).toMatchObject({
      company: "Acme Labs",
      deadline: new Date("2026-12-31"),
      description: "Build reliable systems.\n\n- Ship improvements",
      employmentType: "FULL_TIME",
      location: "New York, NY, US",
      remoteType: "REMOTE",
      salaryCurrency: "USD",
      salaryMax: 195000,
      salaryMin: 160000,
      source: "JSON-LD",
      title: "Senior Platform Engineer",
      url: "https://careers.example.com/jobs/platform-engineer",
    });
    expect(jobImportSeedSchema.safeParse(result.seed).success).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("finds JobPosting objects in arrays, @graph values, and later JSON-LD scripts", async () => {
    const html = `
      <script type="application/ld+json">{"@type":"Organization","name":"Ignored"}</script>
      <script type="application/ld+json">[{"@type":"BreadcrumbList"},{"@graph":[{"@type":["Thing","JobPosting"],"title":"Graph Engineer","employmentType":"Contract"}]}]</script>
    `;
    const result = await importJsonLdJob(getJsonLdSource(), fixtureFetcher(html));

    expect(result).toMatchObject({
      seed: { employmentType: "CONTRACT", title: "Graph Engineer" },
      success: true,
    });
  });

  it("keeps a useful partial seed when company is missing", async () => {
    const result = await importJsonLdJob(
      getJsonLdSource(),
      fixtureFetcher('<script type="application/ld+json">{"@type":"JobPosting","title":"Support Engineer"}</script>'),
    );

    expect(result).toMatchObject({
      seed: {
        source: "JSON-LD",
        title: "Support Engineer",
        url: "https://careers.example.com/jobs/platform-engineer?source=tracker",
      },
      success: true,
    });
    if (result.success) {
      expect(result.seed.company).toBeUndefined();
    }
  });

  it("warns about malformed sibling JSON-LD and chooses the first posting deterministically", async () => {
    const html = `
      <script type="application/ld+json">{ malformed }</script>
      <script type="application/ld+json">{"@type":"JobPosting","title":"First Engineer"}</script>
      <script type="application/ld+json">{"@type":"JobPosting","title":"Second Engineer"}</script>
    `;
    const result = await importJsonLdJob(getJsonLdSource(), fixtureFetcher(html));

    expect(result).toMatchObject({ seed: { title: "First Engineer" }, success: true });
    if (result.success) {
      expect(result.warnings.map(({ code }) => code)).toEqual([
        "MALFORMED_JSON_LD",
        "MULTIPLE_JOB_POSTINGS",
      ]);
    }
  });

  it("omits malformed optional salary data without failing the import", async () => {
    const result = await importJsonLdJob(
      getJsonLdSource(),
      fixtureFetcher('<script type="application/ld+json">{"@type":"JobPosting","title":"Data Engineer","baseSalary":{"currency":"USD","value":{"minValue":"a lot"}}}</script>'),
    );

    expect(result).toMatchObject({ seed: { title: "Data Engineer" }, success: true });
    if (result.success) {
      expect(result.seed.salaryMin).toBeUndefined();
      expect(result.warnings).toContainEqual({
        code: "INVALID_BASE_SALARY",
        message: "The structured salary could not be imported and was omitted.",
      });
    }
  });

  it("returns unsupported when no JobPosting structured data exists", async () => {
    const result = await importJsonLdJob(
      getJsonLdSource(),
      fixtureFetcher('<script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>'),
    );

    expect(result).toEqual({
      error: {
        code: "UNSUPPORTED_SOURCE",
        message: "No supported structured job data was found on this page.",
      },
      success: false,
    });
  });
});
