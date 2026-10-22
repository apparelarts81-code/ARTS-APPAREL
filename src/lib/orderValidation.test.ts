import test from 'node:test';
import assert from 'node:assert/strict';
import { couponService } from '../services/couponService';
import { deliveryService } from '../services/deliveryService';
import { ORDER_STATUS_LABELS } from './constants';

test('couponService.validateCoupon validates percentages and max discounts correctly', async () => {
  // Test with WELCOME10 (10% off, min 3000, max discount 1500)
  const validRes = await couponService.validateCoupon('WELCOME10', 5000);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.discount, 500); // 10% of 5000 = 500

  // Below min order amount
  const belowMinRes = await couponService.validateCoupon('WELCOME10', 2000);
  assert.equal(belowMinRes.valid, false);
  assert.equal(belowMinRes.discount, 0);

  // Exceeding max discount cap
  const maxCapRes = await couponService.validateCoupon('WELCOME10', 25000);
  assert.equal(maxCapRes.valid, true);
  assert.equal(maxCapRes.discount, 1500); // capped at 1500

  // Invalid coupon code
  const invalidRes = await couponService.validateCoupon('NONEXISTENT_CODE', 10000);
  assert.equal(invalidRes.valid, false);
  assert.equal(invalidRes.discount, 0);
});

test('deliveryService.calculateDeliveryCharge calculates local and nationwide rates accurately', async () => {
  // Sadiqabad home city (charge: 100) below threshold
  const localRes = await deliveryService.calculateDeliveryCharge('Sadiqabad', 4500, 10000, 250);
  assert.equal(localRes.charge, 150);
  assert.equal(localRes.isFree, false);

  // Lahore city (charge: 250) below threshold
  const lahoreRes = await deliveryService.calculateDeliveryCharge('Lahore', 5000, 10000, 250);
  assert.equal(lahoreRes.charge, 250);
  assert.equal(lahoreRes.isFree, false);

  // Order >= free delivery threshold (10,000 PKR) receives free delivery (0 PKR)
  const freeRes = await deliveryService.calculateDeliveryCharge('Karachi', 12500, 10000, 250);
  assert.equal(freeRes.charge, 0);
  assert.equal(freeRes.isFree, true);

  // Unlisted city uses default charge
  const unknownCityRes = await deliveryService.calculateDeliveryCharge('Hunza Valley', 3500, 10000, 250);
  assert.equal(unknownCityRes.charge, 250);
  assert.equal(unknownCityRes.isFree, false);
});

test('ORDER_STATUS_LABELS contains all required PRD order states', () => {
  const expectedStates = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
  ];

  for (const state of expectedStates) {
    assert.ok(ORDER_STATUS_LABELS[state as keyof typeof ORDER_STATUS_LABELS]);
    assert.ok(ORDER_STATUS_LABELS[state as keyof typeof ORDER_STATUS_LABELS].en);
    assert.ok(ORDER_STATUS_LABELS[state as keyof typeof ORDER_STATUS_LABELS].ur);
  }
});

import { checkoutFormSchema, contactMessageSchema } from './validators';

test('checkoutFormSchema validates authentic customer submissions', () => {
  const validData = {
    fullName: 'Hamza Farooq',
    phone: '0305 8165623',
    city: 'Sadiqabad',
    address: 'Club Road, House 24 Near Cafe Sajawal',
    paymentMethod: 'cod' as const,
  };

  const parsed = checkoutFormSchema.safeParse(validData);
  assert.equal(parsed.success, true);

  // Invalid phone number format
  const invalidPhone = {
    ...validData,
    phone: '12345',
  };
  const invalidParsed = checkoutFormSchema.safeParse(invalidPhone);
  assert.equal(invalidParsed.success, false);
});

test('contactMessageSchema enforces proper message boundaries', () => {
  const validMessage = {
    name: 'Tariq',
    phone: '0300 1234567',
    message: 'Looking for a bespoke ivory raw silk sherwani for wedding.',
  };
  assert.equal(contactMessageSchema.safeParse(validMessage).success, true);

  // Too short message
  assert.equal(contactMessageSchema.safeParse({ ...validMessage, message: 'Hi' }).success, false);
});

