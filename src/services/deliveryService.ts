import { DeliveryRate } from '../types/database';
import { DEMO_DELIVERY_RATES, DEMO_SETTINGS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_RATES = 'arts_apparel_delivery_rates';

function loadRates(): DeliveryRate[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RATES);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_DELIVERY_RATES];
}

let inMemoryRates: DeliveryRate[] = loadRates();

function saveRates() {
  try {
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(inMemoryRates));
  } catch {}
}

export const deliveryService = {
  async getRates(): Promise<DeliveryRate[]> {
    if (!isDemoMode && supabase) {
      const { data } = await supabase.from('delivery_rates').select('*').order('city', { ascending: true });
      if (data && data.length > 0) return data;
    }
    return [...inMemoryRates];
  },

  async getDeliveryRates(): Promise<DeliveryRate[]> {
    return this.getRates();
  },

  async calculateDeliveryCharge(
    city: string,
    subtotal: number,
    freeThreshold: number = DEMO_SETTINGS.free_delivery_threshold || 10000,
    defaultCharge: number = DEMO_SETTINGS.default_delivery_charge || 250
  ): Promise<{ charge: number; estimatedDays: string; isFree: boolean }> {
    if (subtotal >= freeThreshold) {
      return { charge: 0, estimatedDays: '2-4 business days', isFree: true };
    }

    const rates = await this.getRates();
    const cleanCity = city.trim().toLowerCase();
    const matched = rates.find((r) => r.city.toLowerCase() === cleanCity && r.is_active);

    if (matched) {
      return { charge: matched.charge, estimatedDays: matched.estimated_days, isFree: false };
    }

    return { charge: defaultCharge, estimatedDays: '3-5 business days', isFree: false };
  },

  async updateRate(id: string, updates: Partial<DeliveryRate>): Promise<boolean> {
    inMemoryRates = inMemoryRates.map((r) => (r.id === id ? { ...r, ...updates } : r));
    saveRates();
    if (!isDemoMode && supabase) {
      await supabase.from('delivery_rates').update(updates).eq('id', id);
    }
    return true;
  },

  async addRate(rate: Omit<DeliveryRate, 'id' | 'created_at'>): Promise<DeliveryRate> {
    const newRate: DeliveryRate = {
      ...rate,
      id: `del-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    inMemoryRates = [...inMemoryRates, newRate];
    saveRates();
    if (!isDemoMode && supabase) {
      await supabase.from('delivery_rates').insert([newRate]);
    }
    return newRate;
  },

  async deleteRate(id: string): Promise<boolean> {
    inMemoryRates = inMemoryRates.filter((r) => r.id !== id);
    saveRates();
    if (!isDemoMode && supabase) {
      await supabase.from('delivery_rates').delete().eq('id', id);
    }
    return true;
  },
};
