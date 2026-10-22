import { CartItem } from '../context/CartContext';

const CART_KEY = 'arts_cart';
const COUPON_KEY = 'arts_coupon';

export const cartService = {
  getCart(): CartItem[] {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCart(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  },

  clearCart(): void {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(COUPON_KEY);
  },
};
