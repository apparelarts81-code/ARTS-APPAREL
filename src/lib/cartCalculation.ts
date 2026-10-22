import { Coupon } from '../types/database';

export interface CalculateOrderTotalsInput {
  subtotal: number;
  selectedCity: string;
  freeDeliveryThreshold?: number | null;
  deliveryRates: Array<{ city: string; charge: number; is_active: boolean }>;
  defaultDeliveryCharge: number;
  coupon: Coupon | null;
}

export interface OrderTotalsResult {
  deliveryCharge: number;
  discountAmount: number;
  total: number;
  isFreeDelivery: boolean;
}

export function calculateOrderTotals(input: CalculateOrderTotalsInput): OrderTotalsResult {
  const { subtotal, selectedCity, freeDeliveryThreshold, deliveryRates, defaultDeliveryCharge, coupon } = input;

  if (subtotal <= 0) {
    return {
      deliveryCharge: 0,
      discountAmount: 0,
      total: 0,
      isFreeDelivery: false,
    };
  }

  // Check free delivery threshold
  const isFreeDelivery = Boolean(freeDeliveryThreshold && subtotal >= freeDeliveryThreshold);
  let deliveryCharge = 0;
  if (!isFreeDelivery) {
    const rate = deliveryRates.find(
      (r) => r.city.toLowerCase() === selectedCity.toLowerCase() && r.is_active
    );
    deliveryCharge = rate ? rate.charge : defaultDeliveryCharge;
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon && subtotal >= coupon.min_order_amount) {
    if (coupon.type === 'percent') {
      const calculated = (subtotal * coupon.value) / 100;
      discountAmount = coupon.max_discount ? Math.min(calculated, coupon.max_discount) : calculated;
    } else {
      discountAmount = Math.min(coupon.value, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discountAmount + deliveryCharge);

  return {
    deliveryCharge,
    discountAmount,
    total,
    isFreeDelivery,
  };
}
