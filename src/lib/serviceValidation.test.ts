import test from 'node:test';
import assert from 'node:assert/strict';
import { storageService } from '../services/storageService';
import { isValidPakistaniPhone, normalizePhone } from './format';
import { aiService } from '../services/aiService';
import { reviewService } from '../services/reviewService';
import { orderService } from '../services/orderService';

test('normalizePhone formats standard Pakistani mobile numbers consistently', () => {
  assert.equal(normalizePhone('03058165623'), '03058165623');
  assert.equal(normalizePhone('+923058165623'), '03058165623');
  assert.equal(normalizePhone('923058165623'), '03058165623');
  assert.equal(normalizePhone('0305-8165623'), '03058165623');
  assert.equal(normalizePhone('0305 8165623'), '03058165623');
});

test('isValidPakistaniPhone validates valid and rejects invalid numbers', () => {
  assert.equal(isValidPakistaniPhone('03058165623'), true);
  assert.equal(isValidPakistaniPhone('+92 305 8165623'), true);
  assert.equal(isValidPakistaniPhone('12345'), false);
  assert.equal(isValidPakistaniPhone('02134567890'), false); // Landline prefix not mobile
  assert.equal(isValidPakistaniPhone(''), false);
});

test('storageService validates file types and sizes properly', () => {
  assert.equal(storageService.isValidImageType('image/jpeg'), true);
  assert.equal(storageService.isValidImageType('image/png'), true);
  assert.equal(storageService.isValidImageType('image/webp'), true);
  assert.equal(storageService.isValidImageType('application/pdf'), false);
  assert.equal(storageService.isValidImageType('text/plain'), false);

  const fiveMB = 5 * 1024 * 1024;
  assert.equal(storageService.isValidFileSize(fiveMB, 5), true);
  assert.equal(storageService.isValidFileSize(fiveMB + 1, 5), false);
});

test('aiService.generateReviewSummary returns honest message when zero reviews exist', async () => {
  const emptySummary = await aiService.generateReviewSummary('prod-test', 'Imperial Shalwar Kameez', []);
  assert.equal(emptySummary.summary_en, 'Not enough reviews to summarize.');
  assert.equal(emptySummary.summary_ur, 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔');
});

test('reviewService.generateProductSummary returns honest message when product has no reviews', async () => {
  const summary = await reviewService.generateProductSummary('non-existent-product-id');
  assert.equal(summary.summary_en, 'Not enough reviews to summarize.');
  assert.equal(summary.summary_ur, 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔');
});

test('orderService.trackOrder returns null when order is not found', async () => {
  const result = await orderService.trackOrder('ARTS-999999', '03000000000');
  assert.equal(result, null);
});

test('orderService.placeOrder handles demo order placement with valid structure', async () => {
  const res = await orderService.placeOrder({
    name: 'Asad Khan',
    phone: '03058165623',
    city: 'Sadiqabad',
    address: 'Club Road',
    paymentMethod: 'cod',
    items: [
      {
        product_id: 'prod-1',
        variant_id: 'var-1',
        product_name: 'Imperial Jet Black Shalwar Kameez',
        quantity: 1,
        unit_price: 5499,
        line_total: 5499,
      },
    ],
    subtotal: 5499,
    discountAmount: 0,
    deliveryCharge: 150,
    total: 5649,
  });

  assert.ok(res.order_id);
  assert.ok(res.order_number.startsWith('ARTS-'));
  assert.equal(res.total, 5649);
});

test('aiService.generateReviewSummary produces deterministic review statistics when AI endpoint is offline', async () => {
  const sampleReviews = [
    { rating: 5, comment: 'Exceptional tailoring and fabric quality.' },
    { rating: 4, comment: 'Fit is very sharp and elegant.' },
  ];

  // Call when endpoint fails / mock environment: must produce deterministic statistics without fabricating claims
  const summary = await aiService.generateReviewSummary('prod-test', 'Imperial Shalwar Kameez', sampleReviews);
  assert.ok(summary.summary_en.includes('2 customer review(s)'));
  assert.ok(summary.summary_en.includes('4.5/5 stars'));
  assert.ok(summary.summary_ur.includes('4.5/5'));
});

