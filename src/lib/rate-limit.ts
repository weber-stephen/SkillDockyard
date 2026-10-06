import { createHash } from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface Bucket { count: number; resetAt: number }

export class RateLimitConfigurationError extends Error {
  constructor() {
    super("Shared rate limiting is not configured.");
    this.name = "RateLimitConfigurationError";
  }
}

const localBuckets = new Map<string, Bucket>();
const sharedLimiters = new Map<string, Ratelimit>();

/** Records an aggregate operational signal only; never include an identity, IP, token, or request payload. */
export function recordRateLimitFailure(scope: string) {
  Sentry.captureMessage("Rate limit exceeded", {
    level: "warning",
    tags: { rate_limit_scope: scope, operational_signal: "rate_limit" }
  });
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const cacheKey = `${limit}:${windowMs}`;
    let limiter = sharedLimiters.get(cacheKey);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        prefix: "skill-dockyard"
      });
      sharedLimiters.set(cacheKey, limiter);
    }
    const result = await limiter.limit(key);
    return { allowed: result.success, retryAfterSeconds: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) };
  }
  if (process.env.NODE_ENV === "production") throw new RateLimitConfigurationError();
  return consumeLocalRateLimit(key, limit, windowMs, now);
}

function consumeLocalRateLimit(key: string, limit: number, windowMs: number, now: number) {
  const current = localBuckets.get(key);
  if (!current || current.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + windowMs });
    prune(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function prune(now: number) {
  if (localBuckets.size < 1000) return;
  for (const [key, bucket] of localBuckets) if (bucket.resetAt <= now) localBuckets.delete(key);
}

export function clearRateLimitsForTests() { localBuckets.clear(); sharedLimiters.clear(); }
export function fingerprintRateLimitKey(value: string) { return createHash("sha256").update(value).digest("hex"); }
