import { describe, expect, it } from "vitest";

import {
  createInMemoryJobUrlImportRateLimiter,
  jobUrlImportRateLimitPolicies,
} from "@/features/jobs/import-rate-limit";

describe("job URL import rate limits", () => {
  it("applies the explicit single-import policy per authenticated user", () => {
    const limiter = createInMemoryJobUrlImportRateLimiter();
    const now = 1_000;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(limiter.consume(jobUrlImportRateLimitPolicies.single, "user-one", now)).toBe(true);
    }
    expect(limiter.consume(jobUrlImportRateLimitPolicies.single, "user-one", now)).toBe(false);
    expect(limiter.consume(jobUrlImportRateLimitPolicies.single, "user-two", now)).toBe(true);
  });

  it("keeps the bounded Bulk Add policy independent from Single Add", () => {
    const limiter = createInMemoryJobUrlImportRateLimiter();
    const now = 1_000;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(limiter.consume(jobUrlImportRateLimitPolicies.bulk, "user-one", now)).toBe(true);
    }
    expect(limiter.consume(jobUrlImportRateLimitPolicies.bulk, "user-one", now)).toBe(false);
    expect(limiter.consume(jobUrlImportRateLimitPolicies.single, "user-one", now)).toBe(true);
  });

  it("resets an in-memory window after its configured duration", () => {
    const limiter = createInMemoryJobUrlImportRateLimiter();
    const now = 1_000;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      limiter.consume(jobUrlImportRateLimitPolicies.single, "user-one", now);
    }

    expect(
      limiter.consume(
        jobUrlImportRateLimitPolicies.single,
        "user-one",
        now + jobUrlImportRateLimitPolicies.single.windowMs,
      ),
    ).toBe(true);
  });
});
