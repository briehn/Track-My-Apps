import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  importGreenhouseJob,
  inferGreenhouseRemoteType,
  normalizeGreenhouseDescription,
} from "@/features/jobs/importers/greenhouse";
import { detectJobImportSource } from "@/features/jobs/importers/job-url";

async function loadFixture() {
  const fixtureUrl = new URL("./__fixtures__/greenhouse-job.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
}

function getGreenhouseSource() {
  const result = detectJobImportSource(
    "https://boards.greenhouse.io/acmelabs/jobs/44444?gh_src=career_site#apply",
  );

  if (!result.success) {
    throw new Error("Expected the Greenhouse fixture URL to be detected.");
  }

  return result.source;
}

describe("importGreenhouseJob", () => {
  it("normalizes a realistic Greenhouse response into a validated JobDraft", async () => {
    const requestedUrls: string[] = [];
    const result = await importGreenhouseJob(getGreenhouseSource(), async (url) => {
      requestedUrls.push(url.toString());
      return loadFixture();
    });

    expect(requestedUrls).toEqual([
      "https://boards-api.greenhouse.io/v1/boards/acmelabs/jobs/44444",
    ]);
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.draft).toMatchObject({
      company: "Acme Labs",
      description: "About the role\n\nBuild reliable product experiences with a collaborative engineering team.",
      location: "New York, NY (Hybrid)",
      remoteType: "HYBRID",
      source: "Greenhouse",
      title: "Senior Product Engineer",
      url: "https://boards.greenhouse.io/acmelabs/jobs/44444?gh_src=career_site",
    });
    expect(result.draft.deadline?.toISOString()).toBe("2026-09-01T23:59:59.000Z");
    expect(result.warnings).toEqual([]);
  });

  it("omits malformed optional values and returns a warning", async () => {
    const fixture = await loadFixture();
    const result = await importGreenhouseJob(getGreenhouseSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      application_deadline: "not-a-date",
    }));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.draft.deadline).toBeUndefined();
    expect(result.warnings).toEqual([
      {
        code: "INVALID_APPLICATION_DEADLINE",
        message: "Greenhouse returned an invalid application deadline; it was omitted.",
      },
    ]);
  });

  it("reports malformed required Greenhouse data without creating a draft", async () => {
    const fixture = await loadFixture();
    const result = await importGreenhouseJob(getGreenhouseSource(), async () => ({
      ...(fixture as Record<string, unknown>),
      company_name: 42,
    }));

    expect(result).toEqual({
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Greenhouse returned job data in an unexpected format.",
      },
      success: false,
    });
  });

  it("normalizes encoded Greenhouse markup from the realistic fixture into readable plain text", async () => {
    const fixtureUrl = new URL("./__fixtures__/greenhouse-job-encoded-content.json", import.meta.url);
    const fixture = JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
    const result = await importGreenhouseJob(getGreenhouseSource(), async () => fixture);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.draft.description).toBe(
      "At Algolia — build search experiences & collaborate with teams.\n\nYour role will consist of:\n\n- Building solutions\n- Running experiments\n  - Measuring results\n\nWe support remote and hybrid employees through a flexible workplace strategy.",
    );
    expect(result.draft.remoteType).toBe("REMOTE");
  });
});

describe("normalizeGreenhouseDescription", () => {
  it("preserves paragraphs, lists, bold text, entities, and normalized whitespace", () => {
    expect(
      normalizeGreenhouseDescription(
        "<p>  Build <strong>reliable</strong>&nbsp;systems &amp; services &mdash; together. </p><ul><li>First item</li><li>Second item<ul><li>Nested item</li></ul></li></ul>",
      ),
    ).toBe(
      "Build reliable systems & services — together.\n\n- First item\n- Second item\n  - Nested item",
    );
  });
});

describe("inferGreenhouseRemoteType", () => {
  it.each(["Remote US", "US - Remote", "Remote", "Remote, United States"])(
    "infers REMOTE from the structured location %s",
    (location) => {
      expect(inferGreenhouseRemoteType(location)).toBe("REMOTE");
    },
  );

  it("keeps a remote location authoritative over generic hybrid boilerplate", () => {
    expect(
      inferGreenhouseRemoteType(
        "Remote US",
        "We support remote and hybrid employees through a flexible workplace strategy.",
      ),
    ).toBe("REMOTE");
  });

  it("infers HYBRID from explicit role location or narrowly phrased role requirements", () => {
    expect(inferGreenhouseRemoteType("New York, NY (Hybrid)")).toBe("HYBRID");
    expect(inferGreenhouseRemoteType("Hybrid - 3 days in office")).toBe("HYBRID");
    expect(
      inferGreenhouseRemoteType(
        "New York, NY",
        "This role requires three days per week in our NYC office.",
      ),
    ).toBe("HYBRID");
  });

  it("leaves onsite and ambiguous locations undefined without reliable work-mode evidence", () => {
    expect(inferGreenhouseRemoteType("New York, NY")).toBeUndefined();
    expect(inferGreenhouseRemoteType("United States")).toBeUndefined();
  });
});
