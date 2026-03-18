/**
 * Simple in-memory rate limiter for API routes.
 * For production scale, replace with @upstash/ratelimit + Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (typically IP or userId).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowSeconds * 1000 };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/** Pre-configured rate limiters for common use cases */
export const RATE_LIMITS = {
  /** Auth endpoints: 10 req/min */
  auth: { limit: 10, windowSeconds: 60 },
  /** Search/enumeration endpoints: 10 req/min */
  search: { limit: 10, windowSeconds: 60 },
  /** AI processing: 5 req/min */
  ai: { limit: 5, windowSeconds: 60 },
  /** File uploads: 10 req/min */
  upload: { limit: 10, windowSeconds: 60 },
  /** General API: 60 req/min */
  general: { limit: 60, windowSeconds: 60 },
} as const;
