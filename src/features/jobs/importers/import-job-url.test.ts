import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  importDoverJob: vi.fn(),
}));

vi.mock("@/features/jobs/importers/dover", () => ({
  importDoverJob: mocks.importDoverJob,
}));

import { importJobFromUrl } from "@/features/jobs/importers/import-job-url";

const postingId = "96d27537-f76c-4fc0-9f7a-d5a0070c6d6c";

describe("importJobFromUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes a supported Dover application URL through the dedicated adapter", async () => {
    mocks.importDoverJob.mockResolvedValue({
      seed: { company: "Mural Pay", source: "Dover", title: "Forward Deployed Engineer (FDE)" },
      source: {
        canonicalUrl: `https://app.dover.com/apply/Mural%20Pay/${postingId}`,
        kind: "DOVER",
        postingId,
        submittedUrl: `https://app.dover.com/apply/Mural%20Pay/${postingId}`,
      },
      success: true,
      warnings: [],
    });

    await expect(
      importJobFromUrl(`https://app.dover.com/apply/Mural%20Pay/${postingId}`),
    ).resolves.toMatchObject({ seed: { source: "Dover" }, success: true });

    expect(mocks.importDoverJob).toHaveBeenCalledWith({
      canonicalUrl: `https://app.dover.com/apply/Mural%20Pay/${postingId}`,
      kind: "DOVER",
      postingId,
      submittedUrl: `https://app.dover.com/apply/Mural%20Pay/${postingId}`,
    });
  });
});
