interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter.
 * Protects serverless and edge API routes from excessive traffic and denial-of-service.
 */
export function checkRateLimit(
  identifier: string,
  limit = 60,
  windowMs = 60 * 1000
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
} {
  const now = Date.now();
  const windowStart = now - windowMs;

  const record = rateLimitStore.get(identifier) || { timestamps: [] };

  // Filter out timestamps outside current sliding window
  const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= limit) {
    const oldestTimestamp = activeTimestamps[0];
    const resetMs = oldestTimestamp + windowMs - now;

    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  // Record this request
  activeTimestamps.push(now);
  rateLimitStore.set(identifier, { timestamps: activeTimestamps });

  // Periodically clean up stale entries if store grows large
  if (rateLimitStore.size > 10000) {
    rateLimitStore.forEach((val, key) => {
      const recent = val.timestamps.filter((ts) => ts > windowStart);
      if (recent.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, { timestamps: recent });
      }
    });
  }

  return {
    allowed: true,
    limit,
    remaining: limit - activeTimestamps.length,
    resetMs: windowMs,
  };
}
