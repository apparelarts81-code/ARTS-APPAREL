import { StoreSettingsMap } from '../types/database';
import { DEMO_SETTINGS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_SETTINGS = 'arts_demo_settings';

function loadDemoSettings(): StoreSettingsMap {
  if (typeof window === 'undefined') return { ...DEMO_SETTINGS };
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { ...DEMO_SETTINGS };
}

let inMemorySettings: StoreSettingsMap = loadDemoSettings();

function saveDemoSettings() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(inMemorySettings));
  } catch {}
}

export const settingsService = {
  async getSettings(): Promise<StoreSettingsMap> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.from('store_settings').select('*');
      if (error) {
        throw new Error(`Failed to load store settings: ${error.message}`);
      }

      const map: Partial<StoreSettingsMap> = {};
      if (data && data.length > 0) {
        data.forEach((row: any) => {
          (map as any)[row.key] = row.value;
        });
      }
      return map as StoreSettingsMap;
    }

    if (isDemoMode) {
      return { ...inMemorySettings };
    }

    return {} as StoreSettingsMap;
  },

  async updateSettings(updates: Partial<StoreSettingsMap>): Promise<StoreSettingsMap> {
    if (!isDemoMode && supabase) {
      // Must verify every key write and fail explicitly if not persisted
      for (const [key, value] of Object.entries(updates)) {
        const { error } = await supabase.from('store_settings').upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          throw new Error(`Failed to save setting "${key}": ${error.message}`);
        }
      }
      return this.getSettings();
    }

    if (isDemoMode) {
      inMemorySettings = { ...inMemorySettings, ...updates };
      saveDemoSettings();
      return { ...inMemorySettings };
    }

    throw new Error('Database connection is not configured.');
  },
};
