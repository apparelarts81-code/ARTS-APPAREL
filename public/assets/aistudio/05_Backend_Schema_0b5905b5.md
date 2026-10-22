# 05 — Backend Schema (Supabase / PostgreSQL)
**Project:** ARTS APPAREL — Online Men's Clothing Store

> **This is a planning document.** It does **not** create the database. AI Studio writes Supabase-ready code that matches these names exactly; ChatGPT (Supabase plugin) creates the real project, tables, RLS, functions and buckets from this document and the final code. Table/column/function names here are the single source of truth.

Conventions
- Schema `public`. Primary keys `uuid default gen_random_uuid()` unless stated. Timestamps `timestamptz default now()`.
- Money: `numeric(10,2)` in PKR. Booleans default explicit. Text enums use `CHECK` constraints (listed below).
- **Index every foreign key** and every column used in RLS policies / filters.
- In RLS policies use `(select auth.uid())` (not bare `auth.uid()`) for performance.
- Helper/RPC functions that bypass RLS are `SECURITY DEFINER` with `set search_path = ''` (fully-qualified names) and validate their inputs and the caller's role inside.
- Never put secrets in tables. `store_settings` is publicly readable.

---

## 1. Enumerated Values (CHECK constraints)

| Column | Allowed values |
|---|---|
| `profiles.role` | `customer`, `staff`, `owner` |
| `profiles.preferred_language` | `en`, `ur` |
| `orders.status` | `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned` |
| `orders.payment_method` | `cod`, `jazzcash`, `easypaisa`, `bank_transfer`, `card` |
| `orders.payment_status` | `pending`, `awaiting_verification`, `paid`, `failed`, `refunded` |
| `payment_proofs.status` | `pending`, `approved`, `rejected` |
| `return_requests.status` | `requested`, `approved`, `rejected`, `completed` |
| `coupons.type` | `percent`, `fixed` |
| `contact_messages.status` | `new`, `handled` |

## 2. Tables

### 2.1 `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | FK → `auth.users(id)` ON DELETE CASCADE |
| full_name | text | |
| phone | text | normalized `03XXXXXXXXX` |
| email | text | copy of auth email (set by trigger) |
| role | text NOT NULL default `'customer'` | CHECK enum |
| preferred_language | text default `'en'` | CHECK enum |
| created_at, updated_at | timestamptz | |

### 2.2 `addresses`
`id`, `user_id` uuid NOT NULL FK → `profiles(id)` CASCADE, `label` text (Home/Office), `full_name` text NOT NULL, `phone` text NOT NULL, `city` text NOT NULL, `address_line` text NOT NULL, `is_default` boolean default false, `created_at`.
Index: `(user_id)`. Partial unique index: one default per user `(user_id) WHERE is_default`.

### 2.3 `store_settings`
`key` text PK, `value` jsonb NOT NULL, `updated_at`, `updated_by` uuid NULL FK → `profiles(id)`.

Seed keys (values from PRD §2; owner may edit):
`store_name` ("ARTS APPAREL"), `tagline_en`, `tagline_ur`, `whatsapp_number` ("923058165623"), `phone_number` ("03058165623"), `email` ("artsapparel@gmail.com"), `address` ("Club Road, Near New Cafe Sajawal, Sadiqabad, Pakistan"), `tiktok_url` ("https://tiktok.com/@artsapparel3"), `facebook_url` (page URL from PRD), `instagram_url` (null), `announcement_en`, `announcement_ur`, `currency` ("PKR"), `cod_enabled` (true), `jazzcash_enabled` (true), `easypaisa_enabled` (true), `bank_transfer_enabled` (true), `card_enabled` (false), `jazzcash_account` ({title, number}), `easypaisa_account` ({title, number}), `bank_account` ({bank_name, account_title, account_number, iban}), `default_delivery_charge` (250 — **placeholder, owner must confirm**), `free_delivery_threshold` (null = disabled), `low_stock_threshold` (5), `return_window_days` (7).
Payment account values start empty/placeholder; the owner fills them in AdminSettingsPage.

### 2.4 `categories`
`id`, `name_en` text NOT NULL, `name_ur` text, `slug` text UNIQUE NOT NULL, `image_url` text, `sort_order` int default 0, `is_active` boolean default true, `created_at`.
Seed: Shalwar Kameez (`shalwar-kameez`), Kurta (`kurta`), Waistcoat (`waistcoat`), Sherwani (`sherwani`), Pants (`pants`), Shirts (`shirts`), Suits (`suits`), Caps (`caps`), Jackets (`jackets`), Ties (`ties`), Track Suits (`track-suits`) with Urdu names.

### 2.5 `products`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| category_id | uuid NOT NULL | FK → `categories(id)` |
| name_en | text NOT NULL | |
| name_ur | text | |
| slug | text UNIQUE NOT NULL | |
| description_en, description_ur | text | |
| fabric | text | |
| base_price | numeric(10,2) NOT NULL | CHECK ≥ 0 |
| sale_price | numeric(10,2) | CHECK (sale_price IS NULL OR sale_price < base_price) |
| is_featured | boolean default false | |
| is_new_arrival | boolean default false | |
| is_active | boolean default true | |
| tags | text[] default '{}' | AI/auto tags, GIN index |
| seo_title, seo_description | text | |
| rating_avg | numeric(3,2) default 0 | maintained by trigger |
| rating_count | int default 0 | maintained by trigger |
| sold_count | int default 0 | incremented when order becomes `delivered` |
| created_at, updated_at | timestamptz | |

Indexes: `(category_id)`, `(slug)`, `(is_active, created_at DESC)`, `(is_featured) WHERE is_active`, GIN `(tags)`, full-text GIN on `to_tsvector('simple', name_en || ' ' || coalesce(name_ur,'') || ' ' || coalesce(fabric,''))`.
Effective price = `coalesce(sale_price, base_price)`; a variant's `price_override`, when set, replaces it.

### 2.6 `product_images`
`id`, `product_id` FK CASCADE NOT NULL, `url` text NOT NULL, `alt_text` text, `sort_order` int default 0, `created_at`. Index `(product_id, sort_order)`.

### 2.7 `product_variants`
`id`, `product_id` FK CASCADE NOT NULL, `size` text NOT NULL (e.g. S, M, L, XL, XXL, 38, 40, Free), `color` text NOT NULL, `color_hex` text, `sku` text UNIQUE, `price_override` numeric(10,2) NULL CHECK ≥ 0, `stock_qty` int NOT NULL default 0 CHECK ≥ 0, `is_active` boolean default true, `created_at`.
Constraints: UNIQUE `(product_id, size, color)`. Index `(product_id)`, partial `(stock_qty) WHERE is_active`.

### 2.8 `size_charts`
`id`, `category_id` FK NOT NULL, `size_label` text NOT NULL, `chest_cm` numeric, `waist_cm` numeric, `length_cm` numeric, `height_min_cm` int, `height_max_cm` int, `weight_min_kg` int, `weight_max_kg` int, `sort_order` int default 0. UNIQUE `(category_id, size_label)`. Index `(category_id)`.
Seed for shirt-like categories with **sample** ranges (S 160–168 cm / 55–65 kg, M 165–173 / 62–72, L 170–178 / 70–80, XL 175–183 / 78–90, XXL 180–190 / 88–105). **Mark as sample — owner must verify** with real measurements.

### 2.9 `banners`
`id`, `title_en`, `title_ur`, `subtitle_en`, `subtitle_ur`, `image_url` NOT NULL, `mobile_image_url`, `link_url`, `button_text_en`, `button_text_ur`, `sort_order` int default 0, `is_active` boolean default true, `created_at`.

### 2.10 `delivery_rates`
`id`, `city` text UNIQUE NOT NULL (stored lower-case-comparable; compare with `lower()`), `charge` numeric(10,2) NOT NULL CHECK ≥ 0, `estimated_days` text (e.g. "2-3 days"), `is_active` boolean default true, `created_at`.
Seed cities (charges are **placeholders**, owner edits in AdminDeliveryPage): Sadiqabad, Rahim Yar Khan, Bahawalpur, Multan, Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Hyderabad, Sukkur, Gujranwala, Sialkot, Peshawar, Quetta. Any other city uses `store_settings.default_delivery_charge`.

### 2.11 `coupons`
`id`, `code` text UNIQUE NOT NULL (stored upper-case), `type` text NOT NULL (enum), `value` numeric(10,2) NOT NULL CHECK > 0 (percent ≤ 100), `min_order_amount` numeric(10,2) default 0, `max_discount` numeric(10,2) NULL, `usage_limit` int NULL, `used_count` int default 0, `starts_at` timestamptz NULL, `expires_at` timestamptz NULL, `is_active` boolean default true, `created_at`.

### 2.12 `orders`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| order_number | text UNIQUE NOT NULL | `'ARTS-' || lpad(nextval('order_number_seq')::text, 6, '0')` |
| user_id | uuid NULL | FK → `profiles(id)` ON DELETE SET NULL; null = guest |
| customer_name | text NOT NULL | |
| customer_phone | text NOT NULL | normalized |
| customer_email | text | |
| shipping_city | text NOT NULL | |
| shipping_address | text NOT NULL | |
| notes | text | customer notes |
| subtotal | numeric(10,2) NOT NULL | |
| discount_amount | numeric(10,2) default 0 | |
| delivery_charge | numeric(10,2) default 0 | |
| total | numeric(10,2) NOT NULL | subtotal − discount + delivery |
| coupon_code | text | |
| payment_method | text NOT NULL | enum |
| payment_status | text NOT NULL default `'pending'` | enum |
| status | text NOT NULL default `'pending'` | enum |
| courier_name | text | free text |
| tracking_number | text | |
| cancel_reason | text | |
| admin_note | text | internal |
| delivered_at | timestamptz | set by trigger when status → delivered |
| created_at, updated_at | timestamptz | |

Indexes: `(user_id)`, `(order_number)`, `(customer_phone)`, `(lower(customer_email))`, `(status, created_at DESC)`, `(created_at DESC)`, `(payment_status)`.

### 2.13 `order_items`
`id`, `order_id` FK CASCADE NOT NULL, `product_id` uuid NULL FK → `products(id)` ON DELETE SET NULL, `variant_id` uuid NULL FK → `product_variants(id)` ON DELETE SET NULL, `product_name` text NOT NULL (snapshot), `size` text, `color` text, `unit_price` numeric(10,2) NOT NULL, `quantity` int NOT NULL CHECK > 0, `line_total` numeric(10,2) NOT NULL, `image_url` text (snapshot). Indexes `(order_id)`, `(product_id)`, `(variant_id)`.

### 2.14 `order_status_history`
`id`, `order_id` FK CASCADE NOT NULL, `status` text NOT NULL, `note` text, `changed_by` uuid NULL FK → `profiles(id)`, `created_at`. Index `(order_id, created_at)`. Written only by trigger.

### 2.15 `payment_proofs`
`id`, `order_id` FK CASCADE NOT NULL, `screenshot_path` text NOT NULL (path inside bucket `payment-proofs`), `transaction_id` text, `amount` numeric(10,2), `status` text default `'pending'` (enum), `review_note` text, `reviewed_by` uuid NULL FK → `profiles(id)`, `reviewed_at` timestamptz, `created_at`. Index `(order_id)`, `(status)`.

### 2.16 `return_requests`
`id`, `order_id` FK NOT NULL, `user_id` uuid NULL FK → `profiles(id)`, `reason` text NOT NULL, `status` text default `'requested'` (enum), `staff_note` text, `created_at`, `updated_at`. Index `(order_id)`, `(user_id)`, `(status)`.

### 2.17 `wishlists`
`user_id` FK → `profiles(id)` CASCADE, `product_id` FK → `products(id)` CASCADE, `created_at`; PK `(user_id, product_id)`; index `(product_id)`.

### 2.18 `reviews`
`id`, `product_id` FK CASCADE NOT NULL, `user_id` FK → `profiles(id)` CASCADE NOT NULL, `rating` int NOT NULL CHECK 1–5, `title` text, `comment` text, `is_approved` boolean default false, `created_at`. UNIQUE `(product_id, user_id)`. Indexes `(product_id, is_approved)`, `(user_id)`.

### 2.19 `review_summaries`
`product_id` uuid PK FK → `products(id)` CASCADE, `summary_en` text, `summary_ur` text, `review_count` int, `generated_at` timestamptz default now().

### 2.20 `contact_messages`
`id`, `name` text NOT NULL, `phone` text, `email` text, `message` text NOT NULL (CHECK length ≤ 2000), `status` text default `'new'`, `created_at`. Index `(status, created_at DESC)`.

### 2.21 `ai_usage_daily`
`usage_date` date NOT NULL, `scope_key` text NOT NULL (`global_public`, `global_admin`, `ip:<hash>`, `user:<uuid>`), `calls` int NOT NULL default 0; PK `(usage_date, scope_key)`. RLS enabled with **no policies** (only service role / the RPC touches it). Old rows (> 7 days) may be cleaned by a scheduled job.

### 2.22 Sequence
`order_number_seq` (start 1).

## 3. Functions (RPC) — exact names, parameters, behavior

| Function | Callable by | Behavior |
|---|---|---|
| `is_staff()` → boolean | internal (policies) | true if current user's `profiles.role` in (`staff`,`owner`) |
| `is_owner()` → boolean | internal | true if role = `owner` |
| `place_order(p_name text, p_phone text, p_email text, p_city text, p_address text, p_notes text, p_payment_method text, p_coupon_code text, p_items jsonb)` → `(order_id uuid, order_number text, total numeric)` | anon, authenticated | `p_items` = `[{"variant_id": uuid, "quantity": int}]`. Validates inputs (phone format, non-empty fields, quantity 1–10 per line, ≤ 20 lines); checks the payment method is enabled in `store_settings`; rate limit (≤ 5 orders per phone per hour); locks variants and **decrements stock atomically** (fail with clear error if insufficient/inactive product); computes unit price server-side (`price_override` → `sale_price` → `base_price`); applies coupon (same rules as `validate_coupon`, increments `used_count`); calls delivery logic (same as `get_delivery_charge`); sets `payment_status` = `pending` for `cod`, `awaiting_verification` is set later when a proof is added; sets `user_id = auth.uid()` when logged in; inserts `order_items` snapshots; first status-history row `pending`. Raises descriptive exceptions the frontend can map (e.g. `OUT_OF_STOCK:<variant_id>`, `COUPON_INVALID`, `RATE_LIMITED`, `PAYMENT_METHOD_DISABLED`). |
| `track_order(p_order_number text, p_phone text)` → jsonb | anon, authenticated | Returns order summary, items, status history, courier/tracking, payment status and whether a proof exists — only if order number AND normalized phone match; otherwise returns null (same response for "not found" and "wrong phone"). |
| `cancel_order(p_order_number text, p_phone text, p_reason text)` → void | anon, authenticated | Allowed only if status in (`pending`,`confirmed`) and (phone matches or `user_id = auth.uid()`); sets `cancelled`, stores reason; stock restored by the status trigger. |
| `add_payment_proof(p_order_number text, p_phone text, p_screenshot_path text, p_transaction_id text)` → uuid | anon, authenticated | Verifies order + phone and that payment method is `jazzcash`/`easypaisa`/`bank_transfer`; inserts `payment_proofs`; sets order `payment_status = 'awaiting_verification'`. |
| `review_payment_proof(p_proof_id uuid, p_status text, p_note text)` → void | staff/owner | `approved` → proof approved + order `payment_status = 'paid'`; `rejected` → proof rejected + order `payment_status = 'failed'`. Records `reviewed_by/at`. |
| `validate_coupon(p_code text, p_subtotal numeric)` → jsonb `{valid, discount, message}` | anon, authenticated | Case-insensitive code; checks active, dates, min order, usage limit; `percent` discount capped by `max_discount`. |
| `get_delivery_charge(p_city text, p_subtotal numeric)` → numeric | anon, authenticated | Active `delivery_rates` match (case-insensitive) else `default_delivery_charge`; returns 0 if `free_delivery_threshold` is set and `p_subtotal` ≥ it. |
| `submit_review(p_product_id uuid, p_rating int, p_title text, p_comment text)` → uuid | authenticated | Requires a `delivered` order of this user containing the product; one review per product per user; inserts with `is_approved = false`. |
| `request_return(p_order_id uuid, p_reason text)` → uuid | authenticated | Own order, status `delivered`, within `return_window_days` of `delivered_at`, no open request. |
| `link_guest_orders()` → int | authenticated | Sets `user_id = auth.uid()` on orders with `user_id IS NULL` and `lower(customer_email)` = the user's **confirmed** auth email. Returns number linked. |
| `set_user_role(p_email text, p_role text)` → void | owner | `p_role` in (`customer`,`staff`); cannot touch users who are `owner`; user must already exist. |
| `admin_dashboard_stats()` → jsonb | staff/owner | `{today_orders, pending_orders, awaiting_verification, low_stock_count, low_stock_items[], latest_orders[], today_sales*, month_revenue*, top_products*[]}` — fields marked * are **null for staff**, filled for owner. Sales count excludes `cancelled`/`returned`. |
| `admin_sales_report(p_from date, p_to date)` → jsonb | owner | Totals, order count, average order value, daily series, best sellers, payment-method split, city split. |
| `admin_customers_list()` → table | staff/owner | Registered customers plus guest customers grouped by phone: name, phone, email, orders_count, total_spent, last_order_at. |
| `consume_ai_quota(p_scope_key text, p_limit int)` → boolean | **service_role only** | Atomically increments today's counter (`INSERT … ON CONFLICT DO UPDATE`) and returns false if `calls` would exceed `p_limit`. `REVOKE EXECUTE` from anon/authenticated. |

## 4. Triggers
1. `on_auth_user_created` (on `auth.users` AFTER INSERT) → inserts `profiles` row (`role='customer'`, name/phone from `raw_user_meta_data`, email).
2. `set_updated_at` BEFORE UPDATE on `profiles`, `products`, `orders`, `return_requests`.
3. `protect_profile_role` BEFORE UPDATE on `profiles`: if `role` changes and the caller is not an owner (via `is_owner()` or service role) → raise exception.
4. `orders_status_changes` AFTER UPDATE OF status on `orders`: insert `order_status_history`; set `delivered_at` and increment `products.sold_count` when → `delivered`; **restore stock** when → `cancelled` (from non-delivered) or `returned`; validate allowed transitions (`pending→confirmed|cancelled`, `confirmed→processing|cancelled`, `processing→shipped|cancelled`, `shipped→delivered`, `delivered→returned`).
5. `reviews_rating_refresh` AFTER INSERT/UPDATE/DELETE on `reviews`: recompute `products.rating_avg` / `rating_count` from approved reviews.
6. `payment_proofs` insert → handled inside `add_payment_proof` (no separate trigger).

## 5. Row Level Security (enable on every table above)

Write all policies with `(select auth.uid())`. `is_staff()` / `is_owner()` as defined.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | own row; `is_staff()` all | trigger only | own row (columns `full_name`, `phone`, `preferred_language` only — see column grants) | — |
| `addresses` | own | own | own | own |
| `store_settings` | **public** | owner | owner | owner |
| `categories` | `is_active` public; `is_staff()` all | owner | owner | owner |
| `products` | `is_active` public; `is_staff()` all | staff/owner | staff/owner | owner |
| `product_images`, `product_variants` | public when parent product active; `is_staff()` all | staff/owner | staff/owner | staff/owner |
| `size_charts` | public | owner | owner | owner |
| `banners` | `is_active` public; owner all | owner | owner | owner |
| `delivery_rates` | `is_active` public; owner all | owner | owner | owner |
| `coupons` | owner | owner | owner | owner (public uses RPC only) |
| `orders` | own (`user_id`); `is_staff()` all | **none** (RPC only) | `is_staff()` (column grants below) | — |
| `order_items` | via own order; `is_staff()` | none (RPC) | — | — |
| `order_status_history` | via own order; `is_staff()` | none (trigger) | — | — |
| `payment_proofs` | via own order; `is_staff()` | none (RPC) | none (RPC `review_payment_proof`) | — |
| `return_requests` | own; `is_staff()` | none (RPC) | `is_staff()` | — |
| `wishlists` | own | own | — | own |
| `reviews` | `is_approved` public; own; `is_staff()` all | none (RPC) | `is_staff()` (approve/hide) | `is_staff()` |
| `review_summaries` | public | service role | service role | owner |
| `contact_messages` | `is_staff()` | anon + authenticated (with length checks) | `is_staff()` | owner |
| `ai_usage_daily` | none | none | none | none (RPC/service role only) |

**Column-level privileges** (RLS cannot restrict columns): `REVOKE UPDATE ON public.orders FROM authenticated; GRANT UPDATE (status, payment_status, courier_name, tracking_number, admin_note, cancel_reason) ON public.orders TO authenticated;` and similarly `REVOKE UPDATE ON public.profiles …; GRANT UPDATE (full_name, phone, preferred_language) …` — the role column is changed only by `set_user_role`.

## 6. Storage

| Bucket | Public | Allowed types | Max size | Policies |
|---|---|---|---|---|
| `product-images` | yes | jpeg, png, webp | 3 MB | public read; insert/update/delete `is_staff()` |
| `site-images` | yes | jpeg, png, webp, svg | 3 MB | public read; write `is_owner()` |
| `payment-proofs` | **no** | jpeg, png, webp | 5 MB | **insert** for anon + authenticated (path must start with an order uuid folder); **select** only `is_staff()` (admin uses signed URLs) or the uploader's own order for logged-in users; no update/delete for non-staff |

## 7. Auth Settings (to configure in Supabase)
- Email + password provider ON; email confirmation ON (owner may change later); minimum password length 8.
- Site URL and redirect URLs: the Cloudflare subdomain now, `https://artsapparelsdk.com` after domain setup (include `/reset-password`).
- Google provider: OFF at launch.
- **Bootstrap the first owner:** after the owner registers normally, a one-time SQL statement sets `profiles.role = 'owner'` for the owner's email (ChatGPT must ask the owner which email to use; do not hardcode).

## 8. Realtime
Not required. (Optional later: realtime on `orders` for admin live notifications.)

## 9. Data Checks ChatGPT Must Perform After Creating the Database
1. Every table/column/RPC name above exists and matches the frontend code (`src/types/database.ts` and `src/services/*`). Mismatch → fix via Pull Request, not in the database silently.
2. RLS enabled on all tables; test as anon, as a customer, as staff and as owner (including that a customer cannot read another customer's order, cannot change their own role, and cannot insert into `orders` directly).
3. `place_order` tested: success, out-of-stock, invalid coupon, disabled payment method, rate limit.
4. Run the Supabase security and performance advisors and report findings.
5. Seed categories, delivery cities (placeholder charges), settings keys, and sample size charts — and tell the owner which values are placeholders.
