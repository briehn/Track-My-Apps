import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  importWorkAtAStartupJob,
  importWorkAtAStartupJobFromHtml,
  normalizeWorkAtAStartupLocation,
} from "@/features/jobs/importers/work-at-a-startup";
import {
  detectJobImportSource,
  type WorkAtAStartupJobSource,
} from "@/features/jobs/importers/job-url";
import { PublicHtmlFetchError } from "@/features/jobs/importers/safe-public-html-fetch";
import { jobDraftSchema, jobImportSeedSchema } from "@/features/jobs/schemas";

async function loadFixture(name: "102292" | "99743") {
  return readFile(new URL(`./__fixtures__/work-at-a-startup-${name}.html`, import.meta.url), "utf8");
}

function getWorkAtAStartupSource(
  jobId = "102292",
  submittedUrl = `https://www.workatastartup.com/jobs/${jobId}?source=tracker#apply`,
): WorkAtAStartupJobSource {
  const result = detectJobImportSource(submittedUrl);

  if (!result.success || result.source.kind !== "WORK_AT_A_STARTUP") {
    throw new Error("Expected the Work at a Startup fixture URL to be detected.");
  }

  return result.source;
}

function withDataPage(page: Record<string, unknown>) {
  const encodedJson = JSON.stringify(page)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div data-page="${encodedJson}"></div>`;
}

function fixturePage(overrides: Record<string, unknown> = {}) {
  return {
    component: "jobs/public/pages/JobDetailPage",
    props: {
      company: { name: "83 Sciences" },
      job: {
        descriptionHtml: "<p>Build reliable systems.</p>",
        id: 102292,
        jobType: "Full-time",
        location: "New York, NY, US / Remote (US)",
        salaryRange: "$160K - $180K",
        title: "Full-Stack Software Engineer",
      },
    },
    url: "/jobs/102292",
    ...overrides,
  };
}

describe("importWorkAtAStartupJob", () => {
  it("fetches only the internally constructed canonical page and imports the 102292 fixture", async () => {
    const requestedUrls: string[] = [];
    const source = getWorkAtAStartupSource();
    const result = await importWorkAtAStartupJob(source, async (url) => {
      requestedUrls.push(url.toString());
      return { finalUrl: url, html: await loadFixture("102292") };
    });

    expect(requestedUrls).toEqual(["https://www.workatastartup.com/jobs/102292"]);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.source).toEqual(source);
    expect(result.seed).toEqual({
      company: "83 Sciences",
      description: "Build research software & ship reliable product.\n\n- Work directly with founders",
      employmentType: "FULL_TIME",
      location: "New York, NY, US",
      remoteType: "REMOTE",
      source: "Work at a Startup",
      title: "Full-Stack Software Engineer",
      url: "https://www.workatastartup.com/jobs/102292",
    });
    expect(result.seed.salaryMin).toBeUndefined();
    expect(result.seed.salaryMax).toBeUndefined();
    expect(result.seed.salaryCurrency).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(jobImportSeedSchema.safeParse(result.seed).success).toBe(true);
    expect(jobDraftSchema.safeParse(result.seed).success).toBe(true);
  });

  it("imports the 99743 fixture with multiple physical locations and remote work", async () => {
    const source = getWorkAtAStartupSource("99743");
    const result = await importWorkAtAStartupJob(source, async (url) => ({
      finalUrl: url,
      html: await loadFixture("99743"),
    }));

    expect(result).toMatchObject({
      seed: {
        company: "Numeral",
        description: "About the role\n\nBuild software with customers.",
        employmentType: "FULL_TIME",
        location: "San Francisco, CA, US / New York, NY, US",
        remoteType: "REMOTE",
        source: "Work at a Startup",
        title: "Forward Deployed Engineer",
        url: "https://www.workatastartup.com/jobs/99743",
      },
      success: true,
    });
  });

  it("requires the expected Inertia component, matching job ID, and matching canonical job URL", () => {
    const source = getWorkAtAStartupSource();

    for (const page of [
      fixturePage({ component: "jobs/public/pages/SomeOtherPage" }),
      fixturePage({ props: { company: { name: "83 Sciences" }, job: { ...fixturePage().props.job, id: 99743 } } }),
      fixturePage({ url: "/jobs/99743" }),
    ]) {
      expect(importWorkAtAStartupJobFromHtml(source, withDataPage(page))).toEqual({
        error: {
          code: "MALFORMED_EXTERNAL_DATA",
          message: "Work at a Startup returned job data in an unexpected format.",
        },
        success: false,
      });
    }
  });

  it.each([
    ["missing data-page", "<main>Job details</main>", "Work at a Startup did not include the expected job data."],
    ["malformed data-page JSON", '<div data-page="{ malformed }"></div>', "Work at a Startup returned malformed job data."],
    ["missing title", withDataPage(fixturePage({ props: { company: { name: "83 Sciences" }, job: { ...fixturePage().props.job, title: " " } } })), "Work at a Startup returned job data in an unexpected format."],
    ["missing company", withDataPage(fixturePage({ props: { company: { name: " " }, job: fixturePage().props.job } })), "Work at a Startup returned job data in an unexpected format."],
  ])("fails safely for %s", (_scenario, html, message) => {
    expect(importWorkAtAStartupJobFromHtml(getWorkAtAStartupSource(), html)).toEqual({
      error: { code: "MALFORMED_EXTERNAL_DATA", message },
      success: false,
    });
  });

  it("leaves unknown employment values unset and never imports display salary", () => {
    const result = importWorkAtAStartupJobFromHtml(
      getWorkAtAStartupSource(),
      withDataPage(fixturePage({ props: { company: { name: "83 Sciences" }, job: { ...fixturePage().props.job, jobType: "Permanent", salaryRange: "$160K - $180K" } } })),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.seed.employmentType).toBeUndefined();
      expect(result.seed.salaryMin).toBeUndefined();
      expect(result.seed.salaryMax).toBeUndefined();
      expect(result.seed.salaryCurrency).toBeUndefined();
    }
  });

  it("keeps a same-origin canonical page requirement after safe fetching", async () => {
    const result = await importWorkAtAStartupJob(getWorkAtAStartupSource(), async () => ({
      finalUrl: new URL("https://example.com/jobs/102292"),
      html: await loadFixture("102292"),
    }));

    expect(result).toEqual({
      error: { code: "EXTRACTION_FAILED", message: "The Work at a Startup job could not be retrieved." },
      success: false,
    });
  });

  it.each([
    new Error("network failure"),
    new PublicHtmlFetchError("RETRIEVAL_FAILED"),
    new PublicHtmlFetchError("INVALID_CONTENT_TYPE"),
  ])("keeps retrieval failures as safe extraction failures", async (error) => {
    const result = await importWorkAtAStartupJob(getWorkAtAStartupSource(), async () => {
      throw error;
    });

    expect(result).toEqual({
      error: { code: "EXTRACTION_FAILED", message: "The Work at a Startup job could not be retrieved." },
      success: false,
    });
  });

  it("does not classify a Work at a Startup 404 as posting unavailable", async () => {
    const result = await importWorkAtAStartupJob(getWorkAtAStartupSource(), async () => {
      throw new PublicHtmlFetchError("RETRIEVAL_FAILED");
    });

    expect(result).toMatchObject({ error: { code: "EXTRACTION_FAILED" }, success: false });
  });
});

describe("normalizeWorkAtAStartupLocation", () => {
  it.each([
    ["Remote", { remoteType: "REMOTE" }],
    ["New York, NY, US / Remote (US)", { location: "New York, NY, US", remoteType: "REMOTE" }],
    ["San Francisco, CA, US / New York, NY, US / Remote (US)", { location: "San Francisco, CA, US / New York, NY, US", remoteType: "REMOTE" }],
    ["New York, NY, US (Hybrid)", { location: "New York, NY, US (Hybrid)", remoteType: "HYBRID" }],
    ["New York, NY, US", { location: "New York, NY, US" }],
  ] as const)("normalizes %s without description inference", (value, expected) => {
    expect(normalizeWorkAtAStartupLocation(value)).toEqual(expected);
  });
});
