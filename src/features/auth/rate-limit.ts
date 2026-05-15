import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const AUTH_RATE_LIMIT_MESSAGE =
  "Too many authentication requests. Please try again later.";

export const AUTH_RATE_LIMIT_POLICIES = {
  signInPage: {
    id: "sign-in-page",
    limit: 30,
    window: "1 m",
    windowMs: 60_000,
  },
  authCallback: {
    id: "auth-callback",
    limit: 60,
    window: "1 m",
    windowMs: 60_000,
  },
  authSession: {
    id: "auth-session",
    limit: 60,
    window: "1 m",
    windowMs: 60_000,
  },
  authGeneral: {
    id: "auth-general",
    limit: 20,
    window: "1 m",
    windowMs: 60_000,
  },
} as const;

export type AuthRateLimitPolicy =
  (typeof AUTH_RATE_LIMIT_POLICIES)[keyof typeof AUTH_RATE_LIMIT_POLICIES];

export type AuthRateLimitCheckResult = {
  limit: number;
  policyId: AuthRateLimitPolicy["id"];
  remaining: number;
  reset: number;
  success: boolean;
  store: "memory" | "upstash";
};

type InMemoryRateLimitEntry = {
  count: number;
  reset: number;
};

const inMemoryRateLimitState = new Map<string, InMemoryRateLimitEntry>();
const ratelimiterCache = new Map<AuthRateLimitPolicy["id"], Ratelimit>();
const loggedWarnings = new Set<string>();

function logRateLimitWarningOnce(key: string, message: string, error?: unknown) {
  if (loggedWarnings.has(key)) {
    return;
  }

  loggedWarnings.add(key);

  console.warn(message, {
    errorMessage:
      error instanceof Error ? error.message : typeof error === "string" ? error : null,
  });
}

function hasRedisRateLimitEnv() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const redisToken =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  return Boolean(redisUrl && redisToken);
}

function getRatelimiter(policy: AuthRateLimitPolicy) {
  const cached = ratelimiterCache.get(policy.id);

  if (cached) {
    return cached;
  }

  const ratelimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
    prefix: `track-my-apps:auth:${policy.id}`,
  });

  ratelimiterCache.set(policy.id, ratelimiter);
  return ratelimiter;
}

export function getClientIpFromHeaders(headers: Headers) {
  const candidates = [
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    headers.get("x-real-ip")?.trim() ?? null,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (candidate.length > 100) {
      continue;
    }

    return candidate;
  }

  return "unknown";
}

export function getAuthRateLimitPolicy(pathname: string): AuthRateLimitPolicy | null {
  if (pathname === "/sign-in") {
    return AUTH_RATE_LIMIT_POLICIES.signInPage;
  }

  if (!pathname.startsWith("/api/auth/")) {
    return null;
  }

  if (pathname.startsWith("/api/auth/callback/")) {
    return AUTH_RATE_LIMIT_POLICIES.authCallback;
  }

  if (pathname === "/api/auth/session") {
    return AUTH_RATE_LIMIT_POLICIES.authSession;
  }

  return AUTH_RATE_LIMIT_POLICIES.authGeneral;
}

export function consumeInMemoryRateLimit(
  key: string,
  policy: AuthRateLimitPolicy,
  now = Date.now(),
): AuthRateLimitCheckResult {
  const existingEntry = inMemoryRateLimitState.get(key);

  if (!existingEntry || existingEntry.reset <= now) {
    const reset = now + policy.windowMs;
    const nextEntry = {
      count: 1,
      reset,
    };

    inMemoryRateLimitState.set(key, nextEntry);

    return {
      success: true,
      limit: policy.limit,
      remaining: Math.max(policy.limit - nextEntry.count, 0),
      reset,
      policyId: policy.id,
      store: "memory",
    };
  }

  existingEntry.count += 1;
  inMemoryRateLimitState.set(key, existingEntry);

  return {
    success: existingEntry.count <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(policy.limit - existingEntry.count, 0),
    reset: existingEntry.reset,
    policyId: policy.id,
    store: "memory",
  };
}

export async function checkAuthRateLimit(options: {
  headers: Headers;
  pathname: string;
}): Promise<AuthRateLimitCheckResult | null> {
  const policy = getAuthRateLimitPolicy(options.pathname);

  if (!policy) {
    return null;
  }

  const ip = getClientIpFromHeaders(options.headers);
  const key = `${policy.id}:${ip}`;

  if (!hasRedisRateLimitEnv()) {
    logRateLimitWarningOnce(
      "missing-auth-rate-limit-store",
      "Auth rate limiting is using the in-memory fallback because Upstash Redis environment variables are not configured.",
    );

    return consumeInMemoryRateLimit(key, policy);
  }

  try {
    const ratelimiter = getRatelimiter(policy);
    const result = await ratelimiter.limit(key);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      policyId: policy.id,
      store: "upstash",
    };
  } catch (error) {
    logRateLimitWarningOnce(
      `auth-rate-limit-store-error:${policy.id}`,
      "Auth rate limiting fell back to the in-memory store after an Upstash Redis error.",
      error,
    );

    return consumeInMemoryRateLimit(key, policy);
  }
}

export function buildRateLimitHeaders(result: AuthRateLimitCheckResult) {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000),
  );

  return {
    "Retry-After": String(retryAfterSeconds),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
