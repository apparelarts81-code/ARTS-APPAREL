import { Banner } from '../types/database';
import { DEMO_BANNERS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_BANNERS = 'arts_apparel_banners';

function loadBanners(): Banner[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BANNERS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_BANNERS];
}

let inMemoryBanners: Banner[] = loadBanners();

function saveBanners() {
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
      if (!error && data && data.length > 0) return data;
    }
    return includeInactive ? [...inMemoryBanners] : inMemoryBanners.filter((b) => b.is_active);
  },

  async addBanner(banner: Omit<Banner, 'id' | 'created_at'>): Promise<Banner> {
    const newBanner: Banner = {
      ...banner,
      id: `ban-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    inMemoryBanners = [...inMemoryBanners, newBanner];
    saveBanners();
    if (!isDemoMode && supabase) {
      await supabase.from('banners').insert([newBanner]);
    }
    return newBanner;
  },

  async updateBanner(id: string, updates: Partial<Banner>): Promise<boolean> {
    inMemoryBanners = inMemoryBanners.map((b) => (b.id === id ? { ...b, ...updates } : b));
    saveBanners();
    if (!isDemoMode && supabase) {
      await supabase.from('banners').update(updates).eq('id', id);
    }
    return true;
  },

  async toggleBanner(id: string): Promise<boolean> {
    inMemoryBanners = inMemoryBanners.map((b) =>
      b.id === id ? { ...b, is_active: !b.is_active } : b
    );
    saveBanners();
    if (!isDemoMode && supabase) {
      const found = inMemoryBanners.find((b) => b.id === id);
      if (found) {
        await supabase.from('banners').update({ is_active: found.is_active }).eq('id', id);
      }
    }
    return true;
  },

  async deleteBanner(id: string): Promise<boolean> {
    inMemoryBanners = inMemoryBanners.filter((b) => b.id !== id);
    saveBanners();
    if (!isDemoMode && supabase) {
      await supabase.from('banners').delete().eq('id', id);
    }
    return true;
  },
};
