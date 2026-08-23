import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
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
});
