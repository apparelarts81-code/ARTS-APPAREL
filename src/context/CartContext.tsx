import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant, Coupon } from '../types/database';
import { useSettings } from './SettingsContext';
import { deliveryService } from '../services/deliveryService';
import { couponService } from '../services/couponService';
import { calculateOrderTotals } from '../lib/cartCalculation';

export interface CartItem {
  product_id: string;
  variant_id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  total: number;
  coupon: Coupon | null;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ valid: boolean; message: string }>;
  removeCoupon: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('arts_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('arts_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedCity, setSelectedCity] = useState<string>('Sadiqabad');
  const [deliveryRates, setDeliveryRates] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    deliveryService.getRates().then(setDeliveryRates);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('arts_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (coupon) {
        localStorage.setItem('arts_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('arts_coupon');
      }
    } catch (e) {
      console.error('Failed to save coupon', e);
    }
  }, [coupon]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const price = item.variant.price_override ?? item.product.sale_price ?? item.product.base_price;
    return sum + price * item.quantity;
  }, 0);

  const { deliveryCharge, discountAmount, total } = calculateOrderTotals({
    subtotal,
    selectedCity,
    freeDeliveryThreshold: settings.free_delivery_threshold,
    deliveryRates,
    defaultDeliveryCharge: settings.default_delivery_charge,
    coupon,
  });

  const addItem = (product: Product, variant: ProductVariant, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.variant_id === variant.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(
          variant.stock_qty,
          updated[existingIndex].quantity + quantity
        );
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          product,
          variant,
        };
        return updated;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          variant_id: variant.id,
          product,
          variant,
          quantity: Math.min(variant.stock_qty, Math.max(1, quantity)),
        },
      ];
    });
    setIsDrawerOpen(true);
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.variant_id === variantId) {
          const max = item.variant.stock_qty;
          return { ...item, quantity: Math.min(max, quantity) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  const applyCoupon = async (code: string): Promise<{ valid: boolean; message: string }> => {
    const res = await couponService.validateCoupon(code, subtotal);
    if (!res.valid || !res.coupon) {
      return { valid: false, message: res.message };
    }
    setCoupon(res.coupon);
    return { valid: true, message: res.message };
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discountAmount,
        deliveryCharge,
        total,
        coupon,
        selectedCity,
        setSelectedCity,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
