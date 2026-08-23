import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canStartBulkJobUrlImport: vi.fn(),
  findMany: vi.fn(),
  importJobFromUrl: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("@/features/auth/require-user", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/features/jobs/import-rate-limit", () => ({
  canStartBulkJobUrlImport: mocks.canStartBulkJobUrlImport,
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

import { reviewBulkJobUrls } from "@/features/jobs/bulk-job-url-import-actions";

const nominalUrl = "https://jobs.gem.com/nominal/am9icG9zdDrl9lWhYeSFOCTw_muGyNcp";

beforeEach(() => {
  mocks.canStartBulkJobUrlImport.mockResolvedValue(true);
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
    warnings: [],
  });
  mocks.requireUser.mockResolvedValue({ id: "current-user" });
});

describe("reviewBulkJobUrls", () => {
  it("passes the normal Gem URL into the importer and returns a Gem review item", async () => {
    const result = await reviewBulkJobUrls(nominalUrl);

    expect(mocks.canStartBulkJobUrlImport).toHaveBeenCalledWith("current-user");
    expect(mocks.importJobFromUrl).toHaveBeenCalledWith(nominalUrl);
    expect(mocks.findMany).toHaveBeenCalledWith({
      select: { company: true, id: true, title: true, url: true },
      where: { userId: "current-user" },
    });
    expect(result).toMatchObject({
      items: [
        {
          lineNumber: 1,
          seed: { company: "Nominal", title: "Product Support Engineer" },
          source: { kind: "GEM" },
          status: "success",
          submittedUrl: nominalUrl,
        },
      ],
      success: true,
    });
  });
});
