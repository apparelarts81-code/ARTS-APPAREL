# FOLLOW_UP_REQUIRED — Supabase & Backend Setup Phase

This document specifies the exact missing database tables, PostgreSQL RPC functions, storage buckets, triggers, and security policies required for the upcoming Supabase project provisioning.

> **CRITICAL RULE OBSERVED:** No live Supabase database was contacted, migrated, seeded, or altered during the code fix phase. All contracts below are extracted directly from `05_Backend_Schema.md` and `02_TRD.md`.

---

## 1. Required PostgreSQL RPC Functions

### 1.1 `place_order`
- **Calling Service:** `src/services/orderService.ts` (`orderService.placeOrder`)
- **Security:** `SECURITY DEFINER`, search_path = `''`, callable by `anon` and `authenticated`.
- **Expected Signature:**
  ```sql
  place_order(
    p_name text,
    p_phone text,
    p_email text,
    p_city text,
    p_address text,
    p_notes text,
    p_payment_method text,
    p_coupon_code text,
    p_items jsonb
  ) RETURNS TABLE (order_id uuid, order_number text, total numeric)
  ```
- **Required Behavior & Constraints:**
  - `p_items` is JSON array formatted as `[{"variant_id": uuid, "quantity": int}]`.
  - Validate non-empty customer name, address, and city.
  - Normalize and validate phone format (`03XXXXXXXXX`).
  - Rate limit: max 5 orders per customer phone per hour; raise `RATE_LIMITED` exception if exceeded.
  - Verify `p_payment_method` is active in `store_settings` (e.g. `cod`, `jazzcash`, `easypaisa`, `bank_transfer`); raise `PAYMENT_METHOD_DISABLED` if inactive.
  - Row-lock variants (`FOR UPDATE`) and verify `stock_qty >= quantity` and `is_active = true`; decrement `stock_qty` atomically. Raise `OUT_OF_STOCK:<variant_id>` if insufficient.
  - Compute unit prices server-side from `coalesce(product_variants.price_override, products.sale_price, products.base_price)`.
  - Validate and compute coupon discount if provided; increment `coupons.used_count`; raise `COUPON_INVALID` if expired or below min order.
  - Calculate delivery charge from `delivery_rates` (or `store_settings.default_delivery_charge`), applying free delivery if subtotal exceeds `store_settings.free_delivery_threshold`.
  - Set `user_id = auth.uid()` when caller is authenticated, or `NULL` for guests.
  - Insert order items snapshots into `order_items`.
  - Insert initial status into `order_status_history` (`status='pending'`).
  - Return created `order_id`, `order_number` (`'ARTS-' || lpad(nextval('order_number_seq')::text, 6, '0')`), and `total`.

### 1.2 `track_order`
- **Calling Service:** `src/services/orderService.ts` (`orderService.trackOrder`)
- **Security:** `SECURITY DEFINER`, search_path = `''`, callable by `anon` and `authenticated`.
- **Expected Signature:**
  ```sql
  track_order(p_order_number text, p_phone text) RETURNS jsonb
  ```
- **Required Behavior:**
  - Return order details, nested items, status history, courier, tracking number, payment status, and payment proof info ONLY if BOTH order number and normalized phone match.
  - Return `NULL` if not found or if phone does not match (do not reveal whether the order number exists).

### 1.3 `cancel_order`
- **Calling Service:** `src/services/orderService.ts` (`orderService.cancelOrder`)
- **Security:** `SECURITY DEFINER`, search_path = `''`, callable by `anon` and `authenticated`.
- **Expected Signature:**
  ```sql
  cancel_order(p_order_number text, p_phone text, p_reason text) RETURNS void
  ```
- **Required Behavior:**
  - Only permitted if current status is `'pending'` or `'confirmed'`.
  - Verification: requires matching normalized phone OR `user_id = auth.uid()`.
  - Sets order status to `'cancelled'`, records cancellation reason.
  - Database trigger `orders_status_changes` must restore stock quantities for variants.

### 1.4 `add_payment_proof`
- **Calling Service:** `src/services/orderService.ts` (`orderService.addPaymentProof`)
- **Security:** `SECURITY DEFINER`, search_path = `''`, callable by `anon` and `authenticated`.
- **Expected Signature:**
  ```sql
  add_payment_proof(
    p_order_number text,
    p_phone text,
    p_screenshot_path text,
    p_transaction_id text
  ) RETURNS uuid
  ```
- **Required Behavior:**
  - Verifies order number and customer phone match.
  - Verifies payment method is manual (`jazzcash`, `easypaisa`, `bank_transfer`).
  - Inserts row into `payment_proofs` with `status = 'pending'`.
  - Updates order `payment_status` to `'awaiting_verification'`.
  - Returns `proof_id`.

### 1.5 `review_payment_proof`
- **Calling Service:** `src/services/orderService.ts` (`orderService.updatePaymentProofStatus`)
- **Security:** `SECURITY DEFINER`, search_path = `''`, callable only by `staff` or `owner`.
- **Expected Signature:**
  ```sql
  review_payment_proof(p_proof_id uuid, p_status text, p_note text) RETURNS void
  ```
- **Required Behavior:**
  - `p_status = 'approved'` -> updates proof to `'approved'`, updates order `payment_status = 'paid'`.
  - `p_status = 'rejected'` -> updates proof to `'rejected'`, updates order `payment_status = 'failed'`.
  - Sets `reviewed_by = auth.uid()` and `reviewed_at = now()`.

### 1.6 `set_user_role`
- **Calling Service:** `src/pages/admin/AdminStaffPage.tsx`
- **Security:** `SECURITY DEFINER`, search_path = `''`, callable strictly by users where `profiles.role = 'owner'`.
- **Expected Signature:**
  ```sql
  set_user_role(p_email text, p_role text) RETURNS void
  ```
- **Required Behavior:**
  - Verifies caller has `is_owner() = true`.
  - `p_role` must be in `('customer', 'staff')`.
  - Target user must already exist in `auth.users` / `profiles`.
  - Cannot demote or modify users who have role `'owner'`.
  - Updates `profiles.role = p_role`.

### 1.7 `validate_coupon`
- **Calling Service:** `src/services/couponService.ts` (`couponService.validateCoupon`)
- **Security:** `SECURITY DEFINER`, search_path = `''`, callable by `anon` and `authenticated`.
- **Expected Signature:**
  ```sql
  validate_coupon(p_code text, p_subtotal numeric) RETURNS jsonb
  ```
- **Required Behavior:**
  - Case-insensitive search on `coupons.code`.
  - Validates `is_active = true`, `starts_at <= now()`, `expires_at >= now()`, `usage_limit > used_count`, and `subtotal >= min_order_amount`.
  - Computes discount, capping percent discounts at `max_discount`.
  - Returns `{ "valid": boolean, "discount": numeric, "message": text }`.

### 1.8 `get_delivery_charge`
- **Calling Service:** `src/services/deliveryService.ts` (`deliveryService.calculateDeliveryCharge`)
- **Security:** `SECURITY DEFINER`, callable by `anon` and `authenticated`.
- **Expected Signature:**
  ```sql
  get_delivery_charge(p_city text, p_subtotal numeric) RETURNS numeric
  ```
- **Required Behavior:**
  - Returns `0` if `store_settings.free_delivery_threshold` is enabled and `p_subtotal >= threshold`.
  - Checks active `delivery_rates` matching `lower(city) = lower(p_city)`.
  - Falls back to `store_settings.default_delivery_charge` if city is unlisted.

### 1.9 `submit_review`
- **Calling Service:** `src/services/reviewService.ts` (`reviewService.submitReview`)
- **Security:** `SECURITY DEFINER`, callable by `authenticated`.
- **Expected Signature:**
  ```sql
  submit_review(p_product_id uuid, p_rating int, p_title text, p_comment text) RETURNS uuid
  ```
- **Required Behavior:**
  - Requires caller (`auth.uid()`) to have at least one order with status `'delivered'` containing the product.
  - Enforces one review per user per product.
  - Inserts row into `reviews` with `is_approved = false`.

### 1.10 `consume_ai_quota`
- **Calling Service:** Server-side AI Worker (`server.ts` or Cloudflare Worker)
- **Security:** `SECURITY DEFINER`, executable strictly by `service_role`. `REVOKE EXECUTE` from `anon` and `authenticated`.
- **Expected Signature:**
  ```sql
  consume_ai_quota(p_scope text, p_units int) RETURNS TABLE (allowed boolean, remaining int, retry_after_seconds int)
  ```
- **Required Behavior:**
  - Atomically increments today's usage in `ai_usage_daily` table for `(current_date, p_scope)` (`INSERT ... ON CONFLICT DO UPDATE`).
  - Returns `allowed = false` if calls exceed daily limit for the scope; otherwise returns `allowed = true`.
  - NOTE: While this RPC is pending database provisioning, `server.ts` uses a conservative process-local sliding window rate limit fallback (20 calls / 10 min for public anonymous scope; 60 calls / 10 min for verified staff scope).

### 1.11 `request_return`
- **Calling Service:** `src/services/returnService.ts` (`returnService.requestReturn`)
- **Security:** `SECURITY DEFINER`, callable by `authenticated`.
- **Expected Signature:**
  ```sql
  request_return(p_order_id uuid, p_reason text) RETURNS uuid
  ```
- **Required Behavior:**
  - Verifies that caller (`auth.uid()`) is the owner of `p_order_id` in `orders`.
  - Verifies that the order has `status = 'delivered'` and `delivered_at >= now() - interval '7 days'`.
  - Enforces that no existing pending/approved return request exists for this order.
  - Inserts row into `return_requests` with `status = 'requested'`, `user_id = auth.uid()`, `reason = p_reason`.
  - Returns created return request `id`.

---

## 2. Required Supabase Storage Buckets

| Bucket Name | Public Access | Allowed MIME Types | Max File Size | Access Policy |
|---|---|---|---|---|
| `payment-proofs` | **Private (No public read)** | `image/jpeg`, `image/png`, `image/webp` | 5 MB | Anon and Authenticated may INSERT only into `{order_id}/*`. SELECT allowed only for Staff and Owner (`is_staff() = true`). |
| `product-images` | **Public** | `image/jpeg`, `image/png`, `image/webp` | 3 MB | Public SELECT. INSERT/UPDATE/DELETE allowed only for Staff and Owner. |
| `site-images` | **Public** | `image/jpeg`, `image/png`, `image/webp` | 5 MB | Public SELECT. INSERT/UPDATE/DELETE allowed only for Owner (`is_owner() = true`). |

---

## 3. Required Database Triggers

1. `on_auth_user_created` (AFTER INSERT ON `auth.users`):
   - Inserts `profiles` record with `role = 'customer'`, email, full_name, and phone from metadata.
2. `protect_profile_role` (BEFORE UPDATE ON `profiles`):
   - If `OLD.role <> NEW.role` and caller is not owner/service_role, raises exception.
3. `orders_status_changes` (AFTER UPDATE OF `status` ON `orders`):
   - Inserts row into `order_status_history`.
   - If transitioning to `'delivered'`, sets `delivered_at = now()` and increments `products.sold_count`.
   - If transitioning to `'cancelled'` or `'returned'`, automatically restores variant stock (`stock_qty = stock_qty + quantity`).
   - Validates transition constraints (`pending -> confirmed|cancelled`, etc.).
4. `reviews_rating_refresh` (AFTER INSERT/UPDATE/DELETE ON `reviews`):
   - Recomputes `products.rating_avg` and `products.rating_count` for approved reviews.

---

## 4. Required Database Sequence

- `order_number_seq` (start with 1, increment 1, padded to 6 digits as `'ARTS-000001'`).
