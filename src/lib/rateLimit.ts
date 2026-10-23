import { SupabaseClient } from '@supabase/supabase-js';

// Local sliding window rate limiter fallback (10 minutes window)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const localRateLimits = new Map<string, RateLimitBucket>();

export async function checkAndConsumeAiQuota(
  scopeKey: string,
  isStaff: boolean = false,
  serverSupabase: SupabaseClient | null = null
): Promise<{ allowed: boolean; retryAfterSeconds?: number; fallbackWarning?: string }> {
  // If database-backed consume_ai_quota RPC is available, use it as single source of truth
  if (serverSupabase) {
    try {
      const { data, error } = await serverSupabase.rpc('consume_ai_quota', {
        p_scope: scopeKey,
        p_units: 1,
      });
      if (!error && data) {
        const allowed = Boolean((data as any).allowed ?? true);
        return {
          allowed,
          retryAfterSeconds: (data as any).retry_after_seconds,
        };
      }
    } catch {
      // Missing or unprovisioned RPC in database
    }
  }

  // Process-local sliding window rate limit fallback:
  // Public/Anonymous scope: max 20 calls per 10 minutes
  // Staff scope: max 60 calls per 10 minutes
  // NOTE: Process-local limits are per-instance and do not replace persistent database quotas in distributed environments.
  const maxLimit = isStaff ? 60 : 20;
  const windowMs = 10 * 60 * 1000;
  const now = Date.now();

  let bucket = localRateLimits.get(scopeKey);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    localRateLimits.set(scopeKey, bucket);
  }

  if (bucket.count >= maxLimit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      fallbackWarning: 'Process-local fallback rate limit exceeded; persistent database quota pending provisioning.',
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    fallbackWarning: 'Process-local rate limit active; database quota function pending provisioning.',
  };
}

// Reset rate limits for testing
export function _resetRateLimits(): void {
  localRateLimits.clear();
}
