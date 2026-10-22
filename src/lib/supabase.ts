import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env || {});
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isDemoMode = !url || !key || typeof url !== 'string' || url.trim() === '' || typeof key !== 'string' || key.trim() === '';

export const supabase: SupabaseClient | null = isDemoMode
  ? null
  : createClient(url as string, key as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
