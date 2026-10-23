import { Coupon } from '../types/database';
import { DEMO_COUPONS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_COUPONS = 'arts_demo_coupons';

function loadDemoCoupons(): Coupon[] {
  if (typeof window === 'undefined') return [...DEMO_COUPONS];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COUPONS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_COUPONS];
}

let inMemoryCoupons: Coupon[] = loadDemoCoupons();

function saveDemoCoupons() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(inMemoryCoupons));
  } catch {}
}

export const couponService = {
  async getCoupons(): Promise<Coupon[]> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) {
        throw new Error(`Failed to load coupons: ${error.message}`);
      }
      return data || [];
    }

    if (isDemoMode) {
      return [...inMemoryCoupons];
    }

    return [];
  },

  async validateCoupon(
    code: string,
    subtotal: number
  ): Promise<{ valid: boolean; discount: number; message: string; coupon?: Coupon }> {
    const cleanCode = code.trim().toUpperCase();

    // In production with Supabase, call authoritative validate_coupon RPC first
    if (!isDemoMode && supabase) {
      try {
        const { data, error } = await supabase.rpc('validate_coupon', {
          p_code: cleanCode,
          p_subtotal: subtotal,
        });

        if (!error && data) {
          return {
            valid: Boolean(data.valid),
            discount: Number(data.discount || 0),
            message: data.message || (data.valid ? `Coupon "${cleanCode}" applied!` : 'Invalid coupon code.'),
          };
        }
      } catch (err) {
        console.warn('validate_coupon RPC call warning, falling back to direct table check:', err);
      }

      // Direct table check fallback under RLS
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        return { valid: false, discount: 0, message: 'Invalid or inactive promotional voucher code.' };
      }

      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        return {
          valid: false,
          discount: 0,
          message: `This coupon requires a minimum subtotal of Rs. ${coupon.min_order_amount.toLocaleString()}.`,
        };
      }

      let discount = 0;
      if (coupon.type === 'percent') {
        discount = (subtotal * coupon.value) / 100;
        if (coupon.max_discount && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else {
        discount = Math.min(coupon.value, subtotal);
      }

      return {
        valid: true,
        discount: Math.round(discount),
        message: `Coupon "${cleanCode}" successfully applied!`,
        coupon,
      };
    }

    // Demo Mode Validation
    if (isDemoMode) {
      const all = await this.getCoupons();
      const found = all.find((c) => c.code.toUpperCase() === cleanCode && c.is_active);

      if (!found) {
        return { valid: false, discount: 0, message: 'Invalid or inactive promotional voucher code.' };
      }

      if (found.min_order_amount && subtotal < found.min_order_amount) {
        return {
          valid: false,
          discount: 0,
          message: `This coupon requires a minimum subtotal of Rs. ${found.min_order_amount.toLocaleString()}.`,
        };
      }

      let discount = 0;
      if (found.type === 'percent') {
        discount = (subtotal * found.value) / 100;
        if (found.max_discount && discount > found.max_discount) {
          discount = found.max_discount;
        }
      } else {
        discount = Math.min(found.value, subtotal);
      }

      return {
        valid: true,
        discount: Math.round(discount),
        message: `Coupon "${cleanCode}" successfully applied!`,
        coupon: found,
      };
    }

    return { valid: false, discount: 0, message: 'Coupon validation service is not configured.' };
  },

  async addCoupon(coupon: Omit<Coupon, 'id' | 'used_count'>): Promise<Coupon> {
    const cleanCode = coupon.code.toUpperCase().trim();

    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          code: cleanCode,
          type: coupon.type,
          value: coupon.value,
          min_order_amount: coupon.min_order_amount || 0,
          max_discount: coupon.max_discount || null,
          usage_limit: coupon.usage_limit || null,
          starts_at: coupon.starts_at || null,
          expires_at: coupon.expires_at || null,
          is_active: coupon.is_active ?? true,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create coupon: ${error.message}`);
      }
      return data as Coupon;
    }

    if (isDemoMode) {
      const newCoupon: Coupon = {
        ...coupon,
        id: `coup-${Date.now()}`,
        used_count: 0,
        code: cleanCode,
      };
      inMemoryCoupons = [newCoupon, ...inMemoryCoupons];
      saveDemoCoupons();
      return newCoupon;
    }

    throw new Error('Database connection is not configured.');
  },

  async toggleCoupon(id: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { data: current, error: fetchErr } = await supabase.from('coupons').select('is_active').eq('id', id).single();
      if (fetchErr || !current) {
        throw new Error(`Failed to find coupon: ${fetchErr?.message || 'Not found'}`);
      }

      const { error } = await supabase.from('coupons').update({ is_active: !current.is_active }).eq('id', id);
      if (error) {
        throw new Error(`Failed to update coupon status: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryCoupons = inMemoryCoupons.map((c) =>
        c.id === id ? { ...c, is_active: !c.is_active } : c
      );
      saveDemoCoupons();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async deleteCoupon(id: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) {
        throw new Error(`Failed to delete coupon: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryCoupons = inMemoryCoupons.filter((c) => c.id !== id);
      saveDemoCoupons();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },
};
