import { Address } from '../types/database';

function getStorageKey(userId: string) {
  return `arts_addresses_${userId}`;
}

export const addressService = {
  getAddresses(userId: string): Address[] {
    try {
      const saved = localStorage.getItem(getStorageKey(userId));
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }

    // Default primary address for initial users
    const defaultAddresses: Address[] = [
      {
        id: `addr-${userId}-default`,
        user_id: userId,
        label: 'Home',
        full_name: 'Customer',
        phone: '0305 8165623',
        city: 'Sadiqabad',
        address_line: 'Club Road, Near New Cafe Sajawal',
        is_default: true,
        created_at: new Date().toISOString(),
      },
    ];

    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(defaultAddresses));
    } catch (e) {
      console.error(e);
    }

    return defaultAddresses;
  },

  saveAddress(userId: string, address: Omit<Address, 'id' | 'user_id' | 'created_at'>): Address {
    const list = this.getAddresses(userId);
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

    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    return newAddress;
  },

  updateAddress(userId: string, addressId: string, updates: Partial<Address>): Address[] {
    const list = this.getAddresses(userId);
    let updated = list.map((a) => {
      if (a.id === addressId) {
        return { ...a, ...updates };
      }
      if (updates.is_default) {
        return { ...a, is_default: false };
      }
      return a;
    });

    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    return updated;
  },

  deleteAddress(userId: string, addressId: string): Address[] {
    const list = this.getAddresses(userId);
    const filtered = list.filter((a) => a.id !== addressId);
    if (filtered.length > 0 && !filtered.some((a) => a.is_default)) {
      filtered[0].is_default = true;
    }
    localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
    return filtered;
  },

  setDefaultAddress(userId: string, addressId: string): Address[] {
    const list = this.getAddresses(userId);
    const updated = list.map((a) => ({
      ...a,
      is_default: a.id === addressId,
    }));
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    return updated;
  },
};
