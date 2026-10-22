import { StoreSettingsMap } from '../types/database';
import { DEMO_SETTINGS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_SETTINGS = 'arts_apparel_settings';

function loadSettings(): StoreSettingsMap {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { ...DEMO_SETTINGS };
}

let inMemorySettings: StoreSettingsMap = loadSettings();

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(inMemorySettings));
  } catch {}
}

export const settingsService = {
  async getSettings(): Promise<StoreSettingsMap> {
    if (!isDemoMode && supabase) {
      const { data } = await supabase.from('store_settings').select('*');
      if (data && data.length > 0) {
        const map: any = { ...inMemorySettings };
        data.forEach((row: any) => {
          map[row.key] = row.value;
        });
        return map;
      }
    }
    return { ...inMemorySettings };
  },

  async updateSettings(updates: Partial<StoreSettingsMap>): Promise<StoreSettingsMap> {
    inMemorySettings = { ...inMemorySettings, ...updates };
    saveSettings();

    if (!isDemoMode && supabase) {
      for (const [key, value] of Object.entries(updates)) {
        await supabase.from('store_settings').upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        });
      }
    }

    return { ...inMemorySettings };
  },
};
