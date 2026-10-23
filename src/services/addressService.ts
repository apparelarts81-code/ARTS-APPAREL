import { Address } from '../types/database';
import { isDemoMode, supabase } from '../lib/supabase';

function getDemoStorageKey(userId: string) {
  return `arts_demo_addresses_${userId}`;
}

const INITIAL_DEMO_ADDRESSES: Address[] = [
  {
    id: 'addr-default-1',
    user_id: 'usr-owner-1',
    label: 'Home',
    full_name: 'Muhammad Usman',
    phone: '0305 8165623',
    city: 'Sadiqabad',
    address_line: 'Club Road, Near New Cafe Sajawal',
    is_default: true,
    created_at: new Date().toISOString(),
  },
];

export const addressService = {
  async getAddresses(userId: string): Promise<Address[]> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to load addresses: ${error.message}`);
      }
      return data || [];
    }

    if (isDemoMode && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(getDemoStorageKey(userId));
        if (saved) return JSON.parse(saved);
      } catch {}
      return INITIAL_DEMO_ADDRESSES;
    }

    return [];
  },

  async saveAddress(userId: string, address: Omit<Address, 'id' | 'user_id' | 'created_at'>): Promise<Address> {
    if (!isDemoMode && supabase) {
      if (address.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert([{
          user_id: userId,
          label: address.label || 'Home',
          full_name: address.full_name.trim(),
          phone: address.phone.trim(),
          city: address.city.trim(),
          address_line: address.address_line.trim(),
          is_default: address.is_default ?? false,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save address: ${error.message}`);
      }
      return data as Address;
    }

    if (isDemoMode) {
      const list = await this.getAddresses(userId);
      const newAddress: Address = {
        ...address,
        id: `addr-${Date.now()}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        is_default: address.is_default || list.length === 0,
      };

      let updated = [...list];
      if (newAddress.is_default) {
        updated = updated.map((a) => ({ ...a, is_default: false }));
      }
      updated.push(newAddress);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(getDemoStorageKey(userId), JSON.stringify(updated));
        } catch {}
      }
      return newAddress;
    }

    throw new Error('Database connection is not configured.');
  },

  async updateAddress(userId: string, addressId: string, updates: Partial<Address>): Promise<Address[]> {
    if (!isDemoMode && supabase) {
      if (updates.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
      }

      const { error } = await supabase.from('addresses').update(updates).eq('id', addressId).eq('user_id', userId);
      if (error) {
        throw new Error(`Failed to update address: ${error.message}`);
      }
      return this.getAddresses(userId);
    }

    if (isDemoMode) {
      const list = await this.getAddresses(userId);
      let updated = list.map((a) => {
        if (a.id === addressId) {
          return { ...a, ...updates };
        }
        if (updates.is_default) {
          return { ...a, is_default: false };
        }
        return a;
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(getDemoStorageKey(userId), JSON.stringify(updated));
        } catch {}
      }
      return updated;
    }

    throw new Error('Database connection is not configured.');
  },

  async deleteAddress(userId: string, addressId: string): Promise<Address[]> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', userId);
      if (error) {
        throw new Error(`Failed to delete address: ${error.message}`);
      }
      return this.getAddresses(userId);
    }

    if (isDemoMode) {
      const list = await this.getAddresses(userId);
      const filtered = list.filter((a) => a.id !== addressId);
      if (filtered.length > 0 && !filtered.some((a) => a.is_default)) {
        filtered[0].is_default = true;
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(getDemoStorageKey(userId), JSON.stringify(filtered));
        } catch {}
      }
      return filtered;
    }

    throw new Error('Database connection is not configured.');
  },

  async setDefaultAddress(userId: string, addressId: string): Promise<Address[]> {
    return this.updateAddress(userId, addressId, { is_default: true });
  },
};
