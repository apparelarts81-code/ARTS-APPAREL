import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlistIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('arts_wishlist');
      return saved ? JSON.parse(saved) : ['prod-1', 'prod-7'];
    } catch {
      return ['prod-1', 'prod-7'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('arts_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {
      console.error(e);
    }
  }, [wishlistIds]);

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = (productId: string) => {
    if (!isLoggedIn) {
      toast('Please log in to save items to your wishlist', 'info');
      return;
    }
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        toast('Removed from wishlist', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        toast('Added to wishlist', 'success');
        return [...prev, productId];
      }
    });
  };

  return (
    <WishlistContext.Provider value={{ wishlistIds, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
