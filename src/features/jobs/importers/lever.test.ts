import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { importLeverJob } from "@/features/jobs/importers/lever";
import { detectJobImportSource } from "@/features/jobs/importers/job-url";
import { jobDraftSchema } from "@/features/jobs/schemas";

async function loadFixture() {
  const fixtureUrl = new URL("./__fixtures__/lever-job.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
}

async function loadOnsiteFixture() {
  const fixtureUrl = new URL("./__fixtures__/lever-job-onsite.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
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

describe("importLeverJob", () => {
  it("normalizes a realistic Lever response into a review seed with a warned company suggestion", async () => {
    const requestedUrls: string[] = [];
    const result = await importLeverJob(getLeverSource(), async (url) => {
      requestedUrls.push(url.toString());
      return loadFixture();
    });

    expect(requestedUrls).toEqual([
      "https://api.lever.co/v0/postings/acme/9b4bbf16-2cd5-4a29-bfef-3fc72aa0243f",
    ]);
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
