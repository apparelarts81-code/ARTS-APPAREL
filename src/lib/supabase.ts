import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env || {});
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  url &&
  key &&
  typeof url === 'string' &&
  url.trim() !== '' &&
  typeof key === 'string' &&
  key.trim() !== ''
);

// Demo mode is active ONLY if:
// 1) Explicitly turned on via VITE_DEMO_MODE === 'true', OR
// 2) Supabase is not configured and VITE_DEMO_MODE is not explicitly disabled ('false')
// When Supabase credentials are provided, demo mode is strictly disabled.
export const isDemoMode = !isSupabaseConfigured && (env.VITE_DEMO_MODE === 'true' || env.VITE_DEMO_MODE !== 'false');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, key as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

