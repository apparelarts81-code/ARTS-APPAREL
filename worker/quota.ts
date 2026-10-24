import { Env } from './env';
import { checkIsolateRateLimit } from './rate-limit';

export interface QuotaCheckResult {
  allowed: boolean;
  remaining?: number;
  retryAfterSeconds?: number;
  reason?: string;
}

/**
 * Enforces AI consumption quota.
 * Uses Supabase database RPC `consume_ai_quota(p_scope, p_units)` as authoritative global quota.
 * Enforces FAIL-CLOSED semantics: if database quota cannot be verified in a configured production
 * environment, the request is denied to prevent runaway consumption or quota evasion.
 */
export async function enforceAiQuota(
  scopeKey: string,
  isStaff: boolean,
  env: Env
): Promise<QuotaCheckResult> {
  // Step 1: Pre-filter with isolate rate limiter
  const isolateCheck = checkIsolateRateLimit(scopeKey, isStaff);
  if (!isolateCheck.allowed) {
    return {
      allowed: false,
      retryAfterSeconds: isolateCheck.retryAfterSeconds || 60,
      reason: 'Rate limit exceeded for current window.',
    };
  }

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  // Step 2: If Supabase service credentials are configured, query authoritative database RPC
  if (supabaseUrl && serviceKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/rpc/consume_ai_quota`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          p_scope: scopeKey,
          p_units: 1,
        }),
      });

      if (!response.ok) {
        // FAIL-CLOSED: Database RPC returned an error; deny request
        return {
          allowed: false,
          retryAfterSeconds: 60,
          reason: 'Database quota service error. Access denied (fail-closed).',
        };
      }

      const raw = await response.json();
      const data = Array.isArray(raw) ? raw[0] : raw;

      if (!data || typeof data !== 'object') {
        // FAIL-CLOSED: Malformed RPC response shape
        return {
          allowed: false,
          retryAfterSeconds: 60,
          reason: 'Database quota response malformed. Access denied (fail-closed).',
        };
      }

      // Check both snake_case and camelCase field variations
      const allowed = data.allowed !== undefined ? Boolean(data.allowed) : true;
      const retryAfter = data.retry_after_seconds ?? data.retryAfterSeconds;
      const remaining = data.remaining ?? data.remaining_units ?? data.remainingUnits;

      if (!allowed) {
        return {
          allowed: false,
          remaining: typeof remaining === 'number' ? remaining : 0,
          retryAfterSeconds: typeof retryAfter === 'number' ? retryAfter : 60,
          reason: 'Global AI quota exceeded.',
        };
      }

      return {
        allowed: true,
        remaining: typeof remaining === 'number' ? remaining : undefined,
      };
    } catch {
      // FAIL-CLOSED: Network or unexpected error calling database quota RPC
      return {
        allowed: false,
        retryAfterSeconds: 60,
        reason: 'Unable to reach database quota service. Access denied (fail-closed).',
      };
    }
  }

  // Step 3: In development / demo mode when database credentials are not configured,
  // rely on isolate rate limit check
  const isProd = env.ENVIRONMENT === 'production' || process?.env?.NODE_ENV === 'production';
  if (isProd) {
    // In production without database credentials, fail-closed
    return {
      allowed: false,
      retryAfterSeconds: 300,
      reason: 'Server quota service is unconfigured. Access denied (fail-closed).',
    };
  }

  return {
    allowed: true,
  };
}
