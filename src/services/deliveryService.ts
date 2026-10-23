import { DeliveryRate } from '../types/database';
import { DEMO_DELIVERY_RATES, DEMO_SETTINGS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_RATES = 'arts_demo_delivery_rates';

function loadDemoRates(): DeliveryRate[] {
  if (typeof window === 'undefined') return [...DEMO_DELIVERY_RATES];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RATES);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_DELIVERY_RATES];
}

let inMemoryRates: DeliveryRate[] = loadDemoRates();

function saveDemoRates() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(inMemoryRates));
  } catch {}
}

export const deliveryService = {
  async getRates(): Promise<DeliveryRate[]> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.from('delivery_rates').select('*').order('city', { ascending: true });
      if (error) {
        throw new Error(`Failed to load delivery rates: ${error.message}`);
      }
      return data || [];
    }

    if (isDemoMode) {
      return [...inMemoryRates];
    }

    return [];
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

    // Attempt authoritative get_delivery_charge RPC first if in production
    if (!isDemoMode && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_delivery_charge', {
          p_city: city.trim(),
          p_subtotal: subtotal,
        });
        if (!error && data !== null && data !== undefined) {
          const numCharge = Number(data);
          return {
            charge: numCharge,
            estimatedDays: numCharge === 0 ? '2-4 business days' : '3-5 business days',
            isFree: numCharge === 0,
          };
        }
      } catch (err) {
        console.warn('get_delivery_charge RPC warning, checking rates table directly:', err);
      }
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
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('delivery_rates').update(updates).eq('id', id);
      if (error) {
        throw new Error(`Failed to update delivery rate: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryRates = inMemoryRates.map((r) => (r.id === id ? { ...r, ...updates } : r));
      saveDemoRates();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async addRate(rate: Omit<DeliveryRate, 'id' | 'created_at'>): Promise<DeliveryRate> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('delivery_rates')
        .insert([{
          city: rate.city.trim().toLowerCase(),
          charge: rate.charge,
          estimated_days: rate.estimated_days,
          is_active: rate.is_active ?? true,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add delivery rate: ${error.message}`);
      }
      return data as DeliveryRate;
    }

    if (isDemoMode) {
      const newRate: DeliveryRate = {
        ...rate,
        id: `del-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      inMemoryRates = [...inMemoryRates, newRate];
      saveDemoRates();
      return newRate;
    }

    throw new Error('Database connection is not configured.');
  },

  async deleteRate(id: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('delivery_rates').delete().eq('id', id);
      if (error) {
        throw new Error(`Failed to delete delivery rate: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryRates = inMemoryRates.filter((r) => r.id !== id);
      saveDemoRates();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },
};
