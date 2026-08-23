import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canStartSingleJobUrlImport: vi.fn(),
  findMany: vi.fn(),
  importJobFromUrl: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("@/features/auth/require-user", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/features/jobs/importers/import-job-url", () => ({
  importJobFromUrl: mocks.importJobFromUrl,
}));

vi.mock("@/features/jobs/import-rate-limit", () => ({
  canStartSingleJobUrlImport: mocks.canStartSingleJobUrlImport,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    job: {
      findMany: mocks.findMany,
    },
  },
}));

import { importJobUrlForCurrentUser } from "@/features/jobs/import-url-actions";

const nominalUrl = "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.canStartSingleJobUrlImport.mockResolvedValue(true);
  mocks.findMany.mockResolvedValue([]);
  mocks.importJobFromUrl.mockResolvedValue({
    seed: {
      company: "Nominal",
      source: "Gem",
      title: "Product Support Engineer",
      url: nominalUrl,
    },
    source: {
      board: "nominal",
      canonicalUrl: nominalUrl,
      kind: "GEM",
      postingId: "am9icG9zdDrl9lWhYeSFOCTw_muGyNcp",
      submittedUrl: nominalUrl,
    },
    success: true,
    warnings: [
      {
        code: "INFERRED_COMPANY",
        message: "Company was inferred from the Gem board identifier. Verify it before saving.",
      },
    ],
  });
  mocks.requireUser.mockResolvedValue({ id: "current-user" });
});

describe("importJobUrlForCurrentUser", () => {
  it("passes the normal Gem URL unchanged through the single-import action and returns a review seed", async () => {
    const result = await importJobUrlForCurrentUser(nominalUrl);

    expect(mocks.importJobFromUrl).toHaveBeenCalledWith(nominalUrl);
    expect(mocks.canStartSingleJobUrlImport).toHaveBeenCalledWith("current-user");
    expect(mocks.findMany).toHaveBeenCalledWith({
      select: { company: true, id: true, title: true, url: true },
      where: { userId: "current-user" },
    });
    expect(result).toEqual({
      seed: {
        company: "Nominal",
        source: "Gem",
        title: "Product Support Engineer",
        url: nominalUrl,
      },
      success: true,
      warnings: [
        {
          code: "INFERRED_COMPANY",
          message: "Company was inferred from the Gem board identifier. Verify it before saving.",
        },
      ],
    });
  });

  it("does not invoke the importer when the authenticated user exceeds the single-import limit", async () => {
    mocks.canStartSingleJobUrlImport.mockResolvedValueOnce(false);

    const result = await importJobUrlForCurrentUser(nominalUrl);

    expect(result).toEqual({
      message: "URL imports are temporarily limited. Please try again in a minute.",
      success: false,
    });
    expect(mocks.importJobFromUrl).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("always scopes the limiter to requireUser rather than client input", async () => {
    mocks.requireUser.mockResolvedValueOnce({ id: "server-derived-user" });

    await importJobUrlForCurrentUser(nominalUrl);

    expect(mocks.canStartSingleJobUrlImport).toHaveBeenCalledWith("server-derived-user");
  });

  it("returns the distinct unavailable result without running duplicate detection", async () => {
    mocks.importJobFromUrl.mockResolvedValueOnce({
      error: {
        code: "POSTING_UNAVAILABLE",
        message: "This Greenhouse job posting is no longer available.",
      },
      success: false,
    });

    const result = await importJobUrlForCurrentUser(
      "https://job-boards.greenhouse.io/66degrees/jobs/6135129004",
    );

    expect(result).toEqual({
      message: "This job posting is no longer available. You can still enter the job manually if you previously applied to it.",
      success: false,
      unavailable: true,
    });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
