import { Banner } from '../types/database';
import { DEMO_BANNERS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_BANNERS = 'arts_demo_banners';

function loadDemoBanners(): Banner[] {
  if (typeof window === 'undefined') return [...DEMO_BANNERS];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BANNERS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_BANNERS];
}

let inMemoryBanners: Banner[] = loadDemoBanners();

function saveDemoBanners() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_BANNERS, JSON.stringify(inMemoryBanners));
  } catch {}
}

export const bannerService = {
  async getBanners(includeInactive = false): Promise<Banner[]> {
    if (!isDemoMode && supabase) {
      let query = supabase.from('banners').select('*').order('sort_order', { ascending: true });
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) {
        throw new Error(`Failed to load banners: ${error.message}`);
      }
      return data || [];
    }

    if (isDemoMode) {
      return includeInactive ? [...inMemoryBanners] : inMemoryBanners.filter((b) => b.is_active);
    }

    return [];
  },

  async addBanner(banner: Omit<Banner, 'id' | 'created_at'>): Promise<Banner> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.from('banners').insert([banner]).select().single();
      if (error) {
        throw new Error(`Failed to create banner: ${error.message}`);
      }
      return data as Banner;
    }

    if (isDemoMode) {
      const newBanner: Banner = {
        ...banner,
        id: `ban-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      inMemoryBanners = [...inMemoryBanners, newBanner];
      saveDemoBanners();
      return newBanner;
    }

    throw new Error('Database connection is not configured.');
  },

  async updateBanner(id: string, updates: Partial<Banner>): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('banners').update(updates).eq('id', id);
      if (error) {
        throw new Error(`Failed to update banner: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryBanners = inMemoryBanners.map((b) => (b.id === id ? { ...b, ...updates } : b));
      saveDemoBanners();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async toggleBanner(id: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { data: current, error: fetchErr } = await supabase.from('banners').select('is_active').eq('id', id).single();
      if (fetchErr || !current) {
        throw new Error(`Failed to find banner: ${fetchErr?.message || 'Not found'}`);
      }

      const { error } = await supabase.from('banners').update({ is_active: !current.is_active }).eq('id', id);
      if (error) {
        throw new Error(`Failed to toggle banner: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      const found = inMemoryBanners.find((b) => b.id === id);
      if (found) {
        found.is_active = !found.is_active;
        saveDemoBanners();
      }
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async deleteBanner(id: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) {
        throw new Error(`Failed to delete banner: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryBanners = inMemoryBanners.filter((b) => b.id !== id);
      saveDemoBanners();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },
};
