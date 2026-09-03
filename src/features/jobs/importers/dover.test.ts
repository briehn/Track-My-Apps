import { describe, expect, it } from "vitest";

import { prepareBulkJobUrlImport } from "@/features/jobs/bulk-job-url-import-service";
import { importDoverJob } from "@/features/jobs/importers/dover";
import { detectJobImportSource, type DoverJobSource } from "@/features/jobs/importers/job-url";
import { PublicHtmlFetchError } from "@/features/jobs/importers/safe-public-html-fetch";
import { jobDraftSchema, jobImportSeedSchema } from "@/features/jobs/schemas";

const postingId = "96d27537-f76c-4fc0-9f7a-d5a0070c6d6c";
const submittedUrl = `https://app.dover.com/apply/Mural%20Pay/${postingId}?source=tracker#apply`;

function getDoverSource(url = submittedUrl): DoverJobSource {
  const result = detectJobImportSource(url);

  if (!result.success || result.source.kind !== "DOVER") {
    throw new Error("Expected the Dover fixture URL to be detected.");
  }

  return result.source;
}

function fixtureJob(overrides: Record<string, unknown> = {}) {
  return {
    client_name: "Mural Pay",
    compensation: {
      currency_code: "USD",
      employment_type: "FULL_TIME",
      lower_bound: null,
      open_to_sharing_comp: false,
      salary_range_type: "YEARLY",
      upper_bound: null,
    },
    id: postingId,
    locations: [
      { location_type: "IN_OFFICE", name: "New York City, NY" },
      { location_type: "IN_OFFICE", name: "Denver, CO" },
    ],
    title: "Forward Deployed Engineer (FDE)",
    user_provided_description: "<p>Build <strong>reliable</strong> systems.</p><ul><li>Work with customers</li></ul>",
    workplace_type: "ONSITE",
    ...overrides,
  };
}

describe("importDoverJob", () => {
  it("requests only the fixed API endpoint derived from the UUID and maps the Mural-shaped payload", async () => {
    const requestedUrls: string[] = [];
    const result = await importDoverJob(getDoverSource(), async (url) => {
      requestedUrls.push(url.toString());
      return { json: fixtureJob({ unexpected_future_field: { nested: true } }), statusCode: 200 };
    });

    expect(requestedUrls).toEqual([
      `https://app.dover.com/api/v1/inbound/application-portal-job/${postingId}`,
    ]);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.source).toEqual(getDoverSource());
    expect(result.seed).toEqual({
      company: "Mural Pay",
      description: "Build reliable systems.\n\n- Work with customers",
      employmentType: "FULL_TIME",
      location: "New York City, NY / Denver, CO",
      remoteType: "ONSITE",
      source: "Dover",
      title: "Forward Deployed Engineer (FDE)",
      url: `https://app.dover.com/apply/Mural%20Pay/${postingId}?source=tracker`,
    });
    expect(result.warnings).toEqual([]);
    expect(jobImportSeedSchema.safeParse(result.seed).success).toBe(true);
    expect(jobDraftSchema.safeParse(result.seed).success).toBe(true);
  });

  it("uses structured company identity and regenerates the saved URL when the cosmetic path segment is wrong", async () => {
    const source = getDoverSource(
      `https://app.dover.com/apply/NOT-THE-COMPANY/${postingId}?source=tracker`,
    );
    const result = await importDoverJob(source, async () => ({ json: fixtureJob(), statusCode: 200 }));

    expect(result).toMatchObject({
      seed: {
        company: "Mural Pay",
        url: `https://app.dover.com/apply/Mural%20Pay/${postingId}?source=tracker`,
      },
      success: true,
    });
  });

  it("keeps remote eligibility out of the physical location field", async () => {
    const result = await importDoverJob(getDoverSource(), async () => ({
      json: fixtureJob({
        locations: [
          { location_type: "REMOTE", name: "International" },
          { location_type: "IN_OFFICE", name: "San Francisco, CA" },
          { location_type: "IN_OFFICE", name: "San Francisco, CA" },
          { location_type: "IN_OFFICE", name: "Washington, DC" },
        ],
        workplace_type: "HYBRID",
      }),
      statusCode: 200,
    }));

    expect(result).toMatchObject({
      seed: {
        location: "San Francisco, CA / Washington, DC",
        remoteType: "HYBRID",
      },
      success: true,
    });
  });

  it("leaves remote-only eligibility and unknown workplace types out of the location seed", async () => {
    const remoteResult = await importDoverJob(getDoverSource(), async () => ({
      json: fixtureJob({
        locations: [{ location_type: "REMOTE", name: "International" }],
        workplace_type: "REMOTE",
      }),
      statusCode: 200,
    }));
    const unknownResult = await importDoverJob(getDoverSource(), async () => ({
      json: fixtureJob({ workplace_type: "FLEXIBLE" }),
      statusCode: 200,
    }));

    expect(remoteResult).toMatchObject({ seed: { remoteType: "REMOTE" }, success: true });
    if (remoteResult.success) expect(remoteResult.seed.location).toBeUndefined();
    expect(unknownResult).toMatchObject({ success: true });
    if (unknownResult.success) expect(unknownResult.seed.remoteType).toBeUndefined();
  });

  it("imports only explicitly shared integer annual compensation", async () => {
    const sharedAnnual = await importDoverJob(getDoverSource(), async () => ({
      json: fixtureJob({
        compensation: {
          currency_code: "usd",
          employment_type: "FULL_TIME",
          lower_bound: 200000,
          open_to_sharing_comp: true,
          salary_range_type: "YEARLY",
          upper_bound: 350000,
        },
      }),
      statusCode: 200,
    }));

    expect(sharedAnnual).toMatchObject({
      seed: { salaryCurrency: "USD", salaryMax: 350000, salaryMin: 200000 },
      success: true,
    });
  });

  it.each([
    { open_to_sharing_comp: false, salary_range_type: "YEARLY", currency_code: "USD", lower_bound: 1, upper_bound: 2 },
    { open_to_sharing_comp: true, salary_range_type: "HOURLY", currency_code: "USD", lower_bound: 1, upper_bound: 2 },
    { open_to_sharing_comp: true, salary_range_type: "YEARLY", currency_code: null, lower_bound: 1, upper_bound: 2 },
    { open_to_sharing_comp: true, salary_range_type: "YEARLY", currency_code: "USD", lower_bound: 1.5, upper_bound: 2 },
    { open_to_sharing_comp: true, salary_range_type: "YEARLY", currency_code: "USD", lower_bound: 3, upper_bound: 2 },
  ])("omits hidden, non-annual, or unsafe salary payloads", async (compensation) => {
    const result = await importDoverJob(getDoverSource(), async () => ({
      json: fixtureJob({ compensation: { employment_type: "FULL_TIME", ...compensation } }),
      statusCode: 200,
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.seed.salaryMin).toBeUndefined();
    expect(result.seed.salaryMax).toBeUndefined();
    expect(result.seed.salaryCurrency).toBeUndefined();
  });

  it("keeps optional description, employment, and compensation fields unset when unavailable", async () => {
    const result = await importDoverJob(getDoverSource(), async () => ({
      json: fixtureJob({
        compensation: { employment_type: "future-type" },
        user_provided_description: " ",
      }),
      statusCode: 200,
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.seed.description).toBeUndefined();
    expect(result.seed.employmentType).toBeUndefined();
    expect(result.seed.salaryMin).toBeUndefined();
  });

  it.each([
    ["mismatched ID", fixtureJob({ id: "11111111-1111-4111-8111-111111111111" })],
    ["blank company", fixtureJob({ client_name: " " })],
    ["blank title", fixtureJob({ title: " " })],
    ["missing title", { client_name: "Mural Pay", id: postingId }],
  ])("rejects malformed successful payloads: %s", async (_scenario, json) => {
    const result = await importDoverJob(getDoverSource(), async () => ({ json, statusCode: 200 }));

    expect(result).toEqual({
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Dover returned job data in an unexpected format.",
      },
      success: false,
    });
  });

  it("classifies only the fixed-endpoint 404 as unavailable", async () => {
    const unavailable = await importDoverJob(getDoverSource(), async () => ({
      json: { detail: "Not found." },
      statusCode: 404,
    }));
    const providerFailure = await importDoverJob(getDoverSource(), async () => {
      throw new PublicHtmlFetchError("RETRIEVAL_FAILED");
    });

    expect(unavailable).toEqual({
      error: {
        code: "POSTING_UNAVAILABLE",
        message: "This Dover job posting is no longer available.",
      },
      success: false,
    });
    expect(providerFailure).toEqual({
      error: { code: "EXTRACTION_FAILED", message: "The Dover job could not be retrieved." },
      success: false,
    });
  });

  it.each([400, 401, 403, 409, 429, 500])(
    "keeps HTTP %i conservative instead of classifying it as unavailable",
    async (statusCode) => {
      const result = await importDoverJob(getDoverSource(), async () => ({
        json: { detail: "Provider failure" },
        statusCode,
      }));

      expect(result).toEqual({
        error: { code: "EXTRACTION_FAILED", message: "The Dover job could not be retrieved." },
        success: false,
      });
    },
  );

  it("flows through Bulk Add as an editable Dover review item", async () => {
    const source = getDoverSource();
    const result = await prepareBulkJobUrlImport(source.canonicalUrl, {
      findExistingJobs: async () => [],
      importJob: async () => importDoverJob(source, async () => ({ json: fixtureJob(), statusCode: 200 })),
    });

    expect(result.items).toMatchObject([
      {
        seed: { company: "Mural Pay", source: "Dover", title: "Forward Deployed Engineer (FDE)" },
        source: { kind: "DOVER" },
        status: "success",
      },
    ]);
  });
});
