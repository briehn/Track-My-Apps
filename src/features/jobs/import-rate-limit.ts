import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const BULK_JOB_IMPORT_LIMIT = 3;
const BULK_JOB_IMPORT_WINDOW = "1 m";
const BULK_JOB_IMPORT_WINDOW_MS = 60_000;
const inMemoryRequests = new Map<string, { count: number; reset: number }>();

let ratelimiter: Ratelimit | undefined;
let didLogFallback = false;

function hasRedisRateLimitEnv() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const redisToken =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  return Boolean(redisUrl && redisToken);
}

function consumeInMemoryRateLimit(userId: string, now = Date.now()) {
  const existing = inMemoryRequests.get(userId);

  if (!existing || existing.reset <= now) {
    inMemoryRequests.set(userId, { count: 1, reset: now + BULK_JOB_IMPORT_WINDOW_MS });
    return true;
  }

  existing.count += 1;
  inMemoryRequests.set(userId, existing);
  return existing.count <= BULK_JOB_IMPORT_LIMIT;
}

export async function canStartBulkJobUrlImport(userId: string) {
  if (!hasRedisRateLimitEnv()) {
    if (!didLogFallback) {
      didLogFallback = true;
      console.warn(
        "Bulk job URL importing is using an in-memory rate-limit fallback because Upstash Redis is not configured.",
      );
    }

    return consumeInMemoryRateLimit(userId);
  }

  try {
    ratelimiter ??= new Ratelimit({
      limiter: Ratelimit.slidingWindow(BULK_JOB_IMPORT_LIMIT, BULK_JOB_IMPORT_WINDOW),
      prefix: "track-my-apps:jobs:bulk-url-import",
      redis: Redis.fromEnv(),
    });
    const result = await ratelimiter.limit(userId);
    return result.success;
  } catch (error) {
    if (!didLogFallback) {
      didLogFallback = true;
      console.warn("Bulk job URL import rate limiting fell back to memory.", {
        errorMessage: error instanceof Error ? error.message : null,
      });
    }

    return consumeInMemoryRateLimit(userId);
  }
}
