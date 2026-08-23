import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type JobUrlImportRateLimitPolicy = {
  limit: number;
  prefix: string;
  window: "1 m";
  windowMs: number;
};

const BULK_JOB_IMPORT_POLICY: JobUrlImportRateLimitPolicy = {
  limit: 3,
  prefix: "track-my-apps:jobs:bulk-url-import",
  window: "1 m",
  windowMs: 60_000,
};
const SINGLE_JOB_IMPORT_POLICY: JobUrlImportRateLimitPolicy = {
  limit: 10,
  prefix: "track-my-apps:jobs:single-url-import",
  window: "1 m",
  windowMs: 60_000,
};

export const jobUrlImportRateLimitPolicies = {
  bulk: BULK_JOB_IMPORT_POLICY,
  single: SINGLE_JOB_IMPORT_POLICY,
} as const;

type InMemoryRequest = { count: number; reset: number };

const ratelimiters = new Map<string, Ratelimit>();
const loggedFallbackPolicies = new Set<string>();

function hasRedisRateLimitEnv() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const redisToken =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  return Boolean(redisUrl && redisToken);
}

export function createInMemoryJobUrlImportRateLimiter() {
  const requests = new Map<string, InMemoryRequest>();

  return {
    consume(policy: JobUrlImportRateLimitPolicy, userId: string, now = Date.now()) {
      const requestKey = `${policy.prefix}:${userId}`;
      const existing = requests.get(requestKey);

      if (!existing || existing.reset <= now) {
        requests.set(requestKey, { count: 1, reset: now + policy.windowMs });
        return true;
      }

      existing.count += 1;
      requests.set(requestKey, existing);
      return existing.count <= policy.limit;
    },
  };
}

const inMemoryRateLimiter = createInMemoryJobUrlImportRateLimiter();

async function canStartJobUrlImport(
  policy: JobUrlImportRateLimitPolicy,
  userId: string,
) {
  const logFallbackOnce = (message: string, error?: unknown) => {
    if (loggedFallbackPolicies.has(policy.prefix)) {
      return;
    }

    loggedFallbackPolicies.add(policy.prefix);
    console.warn(message, {
      ...(error instanceof Error ? { errorMessage: error.message } : {}),
    });
  };

  if (!hasRedisRateLimitEnv()) {
    logFallbackOnce(
      "Job URL importing is using an in-memory rate-limit fallback because Upstash Redis is not configured.",
    );
    return inMemoryRateLimiter.consume(policy, userId);
  }

  try {
    let ratelimiter = ratelimiters.get(policy.prefix);
    if (!ratelimiter) {
      ratelimiter = new Ratelimit({
        limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
        prefix: policy.prefix,
        redis: Redis.fromEnv(),
      });
      ratelimiters.set(policy.prefix, ratelimiter);
    }

    const result = await ratelimiter.limit(userId);
    return result.success;
  } catch (error) {
    logFallbackOnce("Job URL import rate limiting fell back to memory.", error);
    return inMemoryRateLimiter.consume(policy, userId);
  }
}

export async function canStartBulkJobUrlImport(userId: string) {
  return canStartJobUrlImport(BULK_JOB_IMPORT_POLICY, userId);
}

export async function canStartSingleJobUrlImport(userId: string) {
  return canStartJobUrlImport(SINGLE_JOB_IMPORT_POLICY, userId);
}
