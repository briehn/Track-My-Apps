import { readFile } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  importGreenhouseJob,
} from "@/features/jobs/importers/greenhouse";
import { normalizeImportedHtmlToPlainText } from "@/features/jobs/importers/html-to-plain-text";
import {
  detectJobImportSource,
  type GreenhouseJobSource,
} from "@/features/jobs/importers/job-url";
import { inferImportedRemoteType } from "@/features/jobs/importers/work-mode";

async function loadFixture() {
  const fixtureUrl = new URL("./__fixtures__/greenhouse-job.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
}

function getGreenhouseSource(): GreenhouseJobSource {
  const result = detectJobImportSource(
    "https://boards.greenhouse.io/acmelabs/jobs/44444?gh_src=career_site#apply",
  );

  if (!result.success || result.source.kind !== "GREENHOUSE") {
    throw new Error("Expected the Greenhouse fixture URL to be detected.");
  }

  return result.source;
}

function getUnavailableGreenhouseSource(): GreenhouseJobSource {
  const result = detectJobImportSource(
    "https://job-boards.greenhouse.io/66degrees/jobs/6135129004",
  );

  if (!result.success || result.source.kind !== "GREENHOUSE") {
    throw new Error("Expected the unavailable Greenhouse URL to be detected.");
  }

  return result.source;
}

afterEach(() => {
  vi.restoreAllMocks();
});

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

    expect(result.seed).toMatchObject({
      company: "Acme Labs",
      description: "About the role\n\nBuild reliable product experiences with a collaborative engineering team.",
      location: "New York, NY (Hybrid)",
      remoteType: "HYBRID",
      source: "Greenhouse",
      title: "Senior Product Engineer",
      url: "https://boards.greenhouse.io/acmelabs/jobs/44444?gh_src=career_site",
    });
    expect(result.seed.deadline?.toISOString()).toBe("2026-09-01T23:59:59.000Z");
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

    expect(result.seed.deadline).toBeUndefined();
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

  it("reports a verified posting-level Greenhouse not-found response as unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Job not found", status: 404 }), {
        headers: { "content-type": "application/json" },
        status: 404,
      }),
    );

    const result = await importGreenhouseJob(getUnavailableGreenhouseSource());

    expect(globalThis.fetch).toHaveBeenCalledWith(
      new URL("https://boards-api.greenhouse.io/v1/boards/66degrees/jobs/6135129004"),
      expect.objectContaining({ redirect: "error" }),
    );
    expect(result).toEqual({
      error: {
        code: "POSTING_UNAVAILABLE",
        message: "This Greenhouse job posting is no longer available.",
      },
      success: false,
    });
  });

  it.each(["server error", "timeout"])("keeps Greenhouse %s as a retrieval failure", async (scenario) => {
    if (scenario === "server error") {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          headers: { "content-type": "application/json" },
          status: 500,
        }),
      );
    } else {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"));
    }

    const result = await importGreenhouseJob(getUnavailableGreenhouseSource());

    expect(result).toEqual({
      error: {
        code: "EXTRACTION_FAILED",
        message: "The Greenhouse job could not be retrieved.",
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

    expect(result.seed.description).toBe(
      "At Algolia — build search experiences & collaborate with teams.\n\nYour role will consist of:\n\n- Building solutions\n- Running experiments\n  - Measuring results\n\nWe support remote and hybrid employees through a flexible workplace strategy.",
    );
    expect(result.seed.remoteType).toBe("REMOTE");
  });
});

describe("normalizeImportedHtmlToPlainText", () => {
  it("preserves paragraphs, lists, bold text, entities, and normalized whitespace", () => {
    expect(
      normalizeImportedHtmlToPlainText(
        "<p>  Build <strong>reliable</strong>&nbsp;systems &amp; services &mdash; together. </p><ul><li>First item</li><li>Second item<ul><li>Nested item</li></ul></li></ul>",
      ),
    ).toBe(
      "Build reliable systems & services — together.\n\n- First item\n- Second item\n  - Nested item",
    );
  });
});

describe("inferImportedRemoteType", () => {
  it.each(["Remote US", "US - Remote", "Remote", "Remote, United States"])(
    "infers REMOTE from the structured location %s",
    (location) => {
      expect(inferImportedRemoteType({ location })).toBe("REMOTE");
    },
  );

  it("keeps a remote location authoritative over generic hybrid boilerplate", () => {
    expect(
      inferImportedRemoteType({
        description: "We support remote and hybrid employees through a flexible workplace strategy.",
        location: "Remote US",
      }),
    ).toBe("REMOTE");
  });

  it("infers HYBRID from explicit role location or narrowly phrased role requirements", () => {
    expect(inferImportedRemoteType({ location: "New York, NY (Hybrid)" })).toBe("HYBRID");
    expect(inferImportedRemoteType({ location: "Hybrid - 3 days in office" })).toBe("HYBRID");
    expect(
      inferImportedRemoteType({
        description: "This role requires three days per week in our NYC office.",
        location: "New York, NY",
      }),
    ).toBe("HYBRID");
  });

  it("leaves onsite and ambiguous locations undefined without reliable work-mode evidence", () => {
    expect(inferImportedRemoteType({ location: "New York, NY" })).toBeUndefined();
    expect(inferImportedRemoteType({ location: "United States" })).toBeUndefined();
  });
});
