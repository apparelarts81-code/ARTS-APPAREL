import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPKR, normalizePhone, isValidPakistaniPhone } from './format';

test('formatPKR formats numbers to Pakistani Rupee currency notation', () => {
  assert.equal(formatPKR(0), 'Rs. 0');
  assert.equal(formatPKR(4500), 'Rs. 4,500');
  assert.equal(formatPKR(32500), 'Rs. 32,500');
  assert.equal(formatPKR(1000000), 'Rs. 1,000,000');
  assert.equal(formatPKR(NaN), 'Rs. 0');
});

test('normalizePhone normalizes various Pakistani phone number formats', () => {
  assert.equal(normalizePhone('0305 8165623'), '03058165623');
  assert.equal(normalizePhone('+923058165623'), '03058165623');
  assert.equal(normalizePhone('923058165623'), '03058165623');
  assert.equal(normalizePhone('0305-8165623'), '03058165623');
});

test('isValidPakistaniPhone validates standard 11-digit mobile prefixes', () => {
  assert.equal(isValidPakistaniPhone('03058165623'), true);
  assert.equal(isValidPakistaniPhone('+92 305 8165623'), true);
  assert.equal(isValidPakistaniPhone('03001234567'), true);
  assert.equal(isValidPakistaniPhone('02112345678'), false); // Karachi landline not mobile
  assert.equal(isValidPakistaniPhone('12345'), false);
});
