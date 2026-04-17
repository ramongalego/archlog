/**
 * In-memory rate limiter using a fixed-window counter.
 *
 * Appropriate for single-instance deployments. For horizontally-scaled
 * deployments, swap this for a Redis-backed implementation.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + config.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  if (bucket.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: config.limit - bucket.count, resetAt: bucket.resetAt };
}

// Periodic cleanup to prevent unbounded map growth under long-running processes.
if (typeof setInterval !== 'undefined') {
  const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
  }, CLEANUP_INTERVAL_MS).unref?.();
}

export const rateLimits = {
  aiQuery: { limit: 30, windowMs: 60 * 60 * 1000 },
  aiDraft: { limit: 30, windowMs: 60 * 60 * 1000 },
  extract: { limit: 20, windowMs: 60 * 60 * 1000 },
  integrationScan: { limit: 10, windowMs: 60 * 60 * 1000 },
  oauthStart: { limit: 20, windowMs: 5 * 60 * 1000 },
} satisfies Record<string, RateLimitConfig>;
