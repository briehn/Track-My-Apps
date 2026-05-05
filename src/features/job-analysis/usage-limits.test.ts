import { describe, expect, it } from "vitest";

import {
  getUtcDayRange,
  hasReachedDailyAnalysisLimit,
} from "@/features/job-analysis/usage-limits";

describe("getUtcDayRange", () => {
  it("returns predictable UTC day boundaries", () => {
    const now = new Date("2026-05-05T18:42:13.000Z");
    const result = getUtcDayRange(now);

    expect(result.dayStart.toISOString()).toBe("2026-05-05T00:00:00.000Z");
    expect(result.nextDayStart.toISOString()).toBe("2026-05-06T00:00:00.000Z");
  });
});

describe("hasReachedDailyAnalysisLimit", () => {
  it("returns true only when the count reaches or exceeds the limit", () => {
    expect(hasReachedDailyAnalysisLimit(0, 3)).toBe(false);
    expect(hasReachedDailyAnalysisLimit(2, 3)).toBe(false);
    expect(hasReachedDailyAnalysisLimit(3, 3)).toBe(true);
    expect(hasReachedDailyAnalysisLimit(4, 3)).toBe(true);
  });
});
