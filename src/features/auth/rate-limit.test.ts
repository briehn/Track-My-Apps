import { describe, expect, it } from "vitest";

import {
  AUTH_RATE_LIMIT_POLICIES,
  consumeInMemoryRateLimit,
  getAuthRateLimitPolicy,
  getClientIpFromHeaders,
} from "@/features/auth/rate-limit";

describe("getClientIpFromHeaders", () => {
  it("prefers the first x-forwarded-for value", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 70.0.0.1",
      "x-real-ip": "198.51.100.5",
    });

    expect(getClientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip and then unknown", () => {
    expect(
      getClientIpFromHeaders(
        new Headers({
          "x-real-ip": "198.51.100.5",
        }),
      ),
    ).toBe("198.51.100.5");

    expect(getClientIpFromHeaders(new Headers())).toBe("unknown");
  });
});

describe("getAuthRateLimitPolicy", () => {
  it("maps auth paths to the expected policies", () => {
    expect(getAuthRateLimitPolicy("/sign-in")?.id).toBe("sign-in-page");
    expect(getAuthRateLimitPolicy("/api/auth/callback/google")?.id).toBe(
      "auth-callback",
    );
    expect(getAuthRateLimitPolicy("/api/auth/session")?.id).toBe("auth-session");
    expect(getAuthRateLimitPolicy("/api/auth/signin/google")?.id).toBe(
      "auth-general",
    );
    expect(getAuthRateLimitPolicy("/dashboard")).toBeNull();
  });
});

describe("consumeInMemoryRateLimit", () => {
  it("allows requests until the limit is exceeded", () => {
    const policy = AUTH_RATE_LIMIT_POLICIES.authGeneral;
    const key = `test-limit-${Date.now()}`;
    const now = 1_000;

    const first = consumeInMemoryRateLimit(key, policy, now);
    const second = consumeInMemoryRateLimit(key, policy, now + 1);

    expect(first.success).toBe(true);
    expect(first.remaining).toBe(policy.limit - 1);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(policy.limit - 2);

    let finalResult = second;

    for (let index = 0; index < policy.limit; index += 1) {
      finalResult = consumeInMemoryRateLimit(key, policy, now + 2 + index);
    }

    expect(finalResult.success).toBe(false);
    expect(finalResult.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const policy = AUTH_RATE_LIMIT_POLICIES.signInPage;
    const key = `test-reset-${Date.now()}`;
    const start = 10_000;

    consumeInMemoryRateLimit(key, policy, start);
    const afterReset = consumeInMemoryRateLimit(key, policy, start + policy.windowMs + 1);

    expect(afterReset.success).toBe(true);
    expect(afterReset.remaining).toBe(policy.limit - 1);
  });
});
