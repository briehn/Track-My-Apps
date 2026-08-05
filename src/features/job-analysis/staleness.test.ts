import { describe, expect, it } from "vitest";

import { isJobAnalysisStale } from "@/features/job-analysis/staleness";

describe("isJobAnalysisStale", () => {
  it("returns false when no analysis timestamp exists", () => {
    expect(isJobAnalysisStale(new Date("2026-06-02T12:00:00.000Z"), null)).toBe(false);
  });

  it("returns true when the job is newer than the saved analysis", () => {
    expect(
      isJobAnalysisStale(
        new Date("2026-06-02T12:00:01.000Z"),
        new Date("2026-06-02T12:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("returns false when the saved analysis is newer than the job", () => {
    expect(
      isJobAnalysisStale(
        new Date("2026-06-02T12:00:00.000Z"),
        new Date("2026-06-02T12:00:01.000Z"),
      ),
    ).toBe(false);
  });

  it("returns false when both timestamps are equal", () => {
    const timestamp = new Date("2026-06-02T12:00:00.000Z");

    expect(isJobAnalysisStale(timestamp, timestamp)).toBe(false);
  });
});
