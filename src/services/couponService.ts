import { Coupon } from '../types/database';
import { DEMO_COUPONS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_COUPONS = 'arts_apparel_coupons';

function loadCoupons(): Coupon[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COUPONS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_COUPONS];
}

let inMemoryCoupons: Coupon[] = loadCoupons();

function saveCoupons() {
  try {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(inMemoryCoupons));
  } catch {}
}

export const couponService = {
  async getCoupons(): Promise<Coupon[]> {
    if (!isDemoMode && supabase) {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) return data;
    }
    return [...inMemoryCoupons];
  },

  async validateCoupon(
    code: string,
    subtotal: number
  ): Promise<{ valid: boolean; discount: number; message: string; coupon?: Coupon }> {
    const cleanCode = code.trim().toUpperCase();
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
  },

  async addCoupon(coupon: Omit<Coupon, 'id' | 'used_count'>): Promise<Coupon> {
    const newCoupon: Coupon = {
      ...coupon,
      id: `coup-${Date.now()}`,
      used_count: 0,
      code: coupon.code.toUpperCase().trim(),
    };
    inMemoryCoupons = [newCoupon, ...inMemoryCoupons];
    saveCoupons();

    if (!isDemoMode && supabase) {
      await supabase.from('coupons').insert([newCoupon]);
    }
    return newCoupon;
  },

  async toggleCoupon(id: string): Promise<boolean> {
    inMemoryCoupons = inMemoryCoupons.map((c) =>
      c.id === id ? { ...c, is_active: !c.is_active } : c
    );
    saveCoupons();
    if (!isDemoMode && supabase) {
      const target = inMemoryCoupons.find((c) => c.id === id);
      if (target) {
        await supabase.from('coupons').update({ is_active: target.is_active }).eq('id', id);
      }
    }
    return true;
  },

  async deleteCoupon(id: string): Promise<boolean> {
    inMemoryCoupons = inMemoryCoupons.filter((c) => c.id !== id);
    saveCoupons();
    if (!isDemoMode && supabase) {
      await supabase.from('coupons').delete().eq('id', id);
    }
    return true;
  },
};
