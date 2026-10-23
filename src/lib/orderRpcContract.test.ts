import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlaceOrderResponse } from '../services/orderService';

test('normalizePlaceOrderResponse correctly parses array of 1 row from RETURNS TABLE RPC', () => {
  const rpcResult = [
    {
      order_id: 'c4e51234-abcd-4000-8000-0123456789ab',
      order_number: 'ARTS-000105',
      total: 8999,
    },
  ];

  const normalized = normalizePlaceOrderResponse(rpcResult);
  assert.equal(normalized.order_id, 'c4e51234-abcd-4000-8000-0123456789ab');
  assert.equal(normalized.order_number, 'ARTS-000105');
  assert.equal(normalized.total, 8999);
});

test('normalizePlaceOrderResponse correctly parses single object response', () => {
  const rpcResult = {
    order_id: 'e1234567-abcd-4000-8000-0123456789cd',
    order_number: 'ARTS-000106',
    total: '12500',
  };

  const normalized = normalizePlaceOrderResponse(rpcResult);
  assert.equal(normalized.order_id, 'e1234567-abcd-4000-8000-0123456789cd');
  assert.equal(normalized.order_number, 'ARTS-000106');
  assert.equal(normalized.total, 12500);
});

test('normalizePlaceOrderResponse throws on empty array (no records created)', () => {
  assert.throws(
    () => normalizePlaceOrderResponse([]),
    /Authoritative order creation failed: No order record returned/
  );
});

test('normalizePlaceOrderResponse throws on ambiguous multiple rows', () => {
  const duplicateRows = [
    { order_id: 'id-1', order_number: 'ARTS-0001', total: 1000 },
    { order_id: 'id-2', order_number: 'ARTS-0002', total: 2000 },
  ];

  assert.throws(
    () => normalizePlaceOrderResponse(duplicateRows),
    /Authoritative order creation failed: Ambiguous multiple order records/
  );
});

test('normalizePlaceOrderResponse throws on null or undefined', () => {
  assert.throws(
    () => normalizePlaceOrderResponse(null),
    /Authoritative order creation failed: Backend returned an empty response/
  );
  assert.throws(
    () => normalizePlaceOrderResponse(undefined),
    /Authoritative order creation failed: Backend returned an empty response/
  );
});

test('normalizePlaceOrderResponse throws on missing order_id or order_number', () => {
  assert.throws(
    () => normalizePlaceOrderResponse([{ order_id: '', order_number: 'ARTS-0001', total: 1000 }]),
    /Authoritative order creation failed: Missing valid order identifier/
  );

  assert.throws(
    () => normalizePlaceOrderResponse([{ order_id: 'ord-1', order_number: '', total: 1000 }]),
    /Authoritative order creation failed: Missing valid order number/
  );
});

test('normalizePlaceOrderResponse throws on invalid or negative total', () => {
  assert.throws(
    () => normalizePlaceOrderResponse([{ order_id: 'ord-1', order_number: 'ARTS-0001', total: -50 }]),
    /Authoritative order creation failed: Invalid order total amount returned/
  );

  assert.throws(
    () => normalizePlaceOrderResponse([{ order_id: 'ord-1', order_number: 'ARTS-0001', total: 'invalid-price' }]),
    /Authoritative order creation failed: Invalid order total amount returned/
  );
});
