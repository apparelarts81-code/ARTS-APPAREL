/**
 * In-memory sliding window rate limiter for Cloudflare Worker isolate.
 * Extracts client IP from CF-Connecting-IP header.
 */

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const isolateBuckets = new Map<string, RateLimitBucket>();

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown-client';
}

export function checkIsolateRateLimit(
  scopeKey: string,
  isStaff: boolean = false
): { allowed: boolean; retryAfterSeconds?: number } {
  // Public scope: max 20 calls per 10 minutes
  // Staff scope: max 60 calls per 10 minutes
  const maxLimit = isStaff ? 60 : 20;
  const windowMs = 10 * 60 * 1000;
  const now = Date.now();

  let bucket = isolateBuckets.get(scopeKey);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    isolateBuckets.set(scopeKey, bucket);
  }

  if (bucket.count >= maxLimit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
  };
}

export function _resetIsolateRateLimits(): void {
  isolateBuckets.clear();
}
