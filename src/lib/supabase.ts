import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env || {});
const rawUrl = env.VITE_SUPABASE_URL;
const rawKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate that URL is a legitimate URL string and key is non-empty
function isValidHttpUrl(stringCandidate?: unknown): boolean {
  if (typeof stringCandidate !== 'string' || stringCandidate.trim() === '') return false;
  try {
    const parsed = new URL(stringCandidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  isValidHttpUrl(rawUrl) &&
  typeof rawKey === 'string' &&
  rawKey.trim().length > 10
);

// Safe development-only check (never infer 'development' solely from missing keys)
const isDev = Boolean(
  (typeof import.meta !== 'undefined' && (import.meta.env?.DEV || import.meta.env?.MODE === 'development')) ||
  (typeof process !== 'undefined' && process.env && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'))
);

// Demo mode calculation rules:
// 1. In production (!isDev):
//    - If Supabase is configured, demo mode is ALWAYS false (real backend is authoritative).
//    - If Supabase is NOT configured, demo mode is ONLY enabled if explicitly set to 'true'.
//      It never turns itself on silently.
// 2. In local development (isDev):
//    - Explicit VITE_DEMO_MODE === 'true' enables demo mode.
//    - Missing credentials with VITE_DEMO_MODE !== 'false' defaults to demo mode for local onboarding.
export const isDemoMode = isDev
  ? (env.VITE_DEMO_MODE === 'true' || (!isSupabaseConfigured && env.VITE_DEMO_MODE !== 'false'))
  : (!isSupabaseConfigured && env.VITE_DEMO_MODE === 'true');

// If neither Supabase nor explicit demo mode is available in production, fail closed
export const isConfigMissing = !isSupabaseConfigured && !isDemoMode;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl as string, rawKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

