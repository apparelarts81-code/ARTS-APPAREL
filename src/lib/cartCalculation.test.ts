import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotals } from './cartCalculation';
import { Coupon } from '../types/database';

const mockDeliveryRates = [
  { city: 'Sadiqabad', charge: 150, is_active: true },
  { city: 'Rahim Yar Khan', charge: 180, is_active: true },
  { city: 'Lahore', charge: 250, is_active: true },
  { city: 'Karachi', charge: 250, is_active: true },
];

test('calculateOrderTotals applies city specific delivery charge below threshold', () => {
  const result = calculateOrderTotals({
    subtotal: 5000,
    selectedCity: 'Sadiqabad',
    freeDeliveryThreshold: 10000,
    deliveryRates: mockDeliveryRates,
    defaultDeliveryCharge: 250,
    coupon: null,
  });

  assert.equal(result.deliveryCharge, 150);
  assert.equal(result.discountAmount, 0);
  assert.equal(result.total, 5150);
  assert.equal(result.isFreeDelivery, false);
});

test('calculateOrderTotals grants free delivery when subtotal meets or exceeds threshold', () => {
  const result = calculateOrderTotals({
    subtotal: 12000,
    selectedCity: 'Karachi',
    freeDeliveryThreshold: 10000,
    deliveryRates: mockDeliveryRates,
    defaultDeliveryCharge: 250,
    coupon: null,
  });

  assert.equal(result.deliveryCharge, 0);
  assert.equal(result.isFreeDelivery, true);
  assert.equal(result.total, 12000);
});

test('calculateOrderTotals applies percentage coupon correctly with max_discount cap', () => {
  const percentageCoupon: Coupon = {
    id: 'c1',
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    min_order_amount: 3000,
    max_discount: 500,
    usage_limit: null,
    used_count: 0,
    is_active: true,
  };

  // Subtotal 8,000 -> 10% is 800, but capped at 500
  const result = calculateOrderTotals({
    subtotal: 8000,
    selectedCity: 'Lahore',
    freeDeliveryThreshold: 10000,
    deliveryRates: mockDeliveryRates,
    defaultDeliveryCharge: 250,
    coupon: percentageCoupon,
  });

  assert.equal(result.discountAmount, 500);
  assert.equal(result.deliveryCharge, 250);
  assert.equal(result.total, 8000 - 500 + 250);
});

test('calculateOrderTotals rejects coupon if min_order_amount is not met', () => {
  const minOrderCoupon: Coupon = {
    id: 'c2',
    code: 'BIGSPEND',
    type: 'fixed',
    value: 1000,
    min_order_amount: 15000,
    max_discount: null,
    usage_limit: null,
    used_count: 0,
    is_active: true,
  };

  const result = calculateOrderTotals({
    subtotal: 5000,
    selectedCity: 'Lahore',
    freeDeliveryThreshold: 10000,
    deliveryRates: mockDeliveryRates,
    defaultDeliveryCharge: 250,
    coupon: minOrderCoupon,
  });

  assert.equal(result.discountAmount, 0);
});
