const WISHLIST_KEY = 'arts_wishlist';

export const wishlistService = {
  getWishlist(): string[] {
    try {
      const data = localStorage.getItem(WISHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveWishlist(ids: string[]): void {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to save wishlist', e);
    }
  },

  toggle(productId: string): { ids: string[]; added: boolean } {
    const current = this.getWishlist();
    const exists = current.includes(productId);
    let next: string[];
    if (exists) {
      next = current.filter((id) => id !== productId);
    } else {
      next = [...current, productId];
    }
    this.saveWishlist(next);
    return { ids: next, added: !exists };
  },
};
