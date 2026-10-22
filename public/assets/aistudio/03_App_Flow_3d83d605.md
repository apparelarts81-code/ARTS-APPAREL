# 03 — App Flow (User & Admin Experience)
**Project:** ARTS APPAREL — Online Men's Clothing Store

Page names below are the canonical names from `02_TRD.md` §3.

---

## 1. Route Map

### Storefront
| Route | Page | Access |
|---|---|---|
| `/` | HomePage | public |
| `/shop` | ShopPage (all products, filters, sort, AI search) | public |
| `/category/:slug` | CategoryPage | public |
| `/product/:slug` | ProductPage | public |
| `/cart` | CartPage | public |
| `/checkout` | CheckoutPage | public (guest or logged in) |
| `/order-success/:orderNumber` | OrderSuccessPage | public (shown right after placing) |
| `/track-order` | TrackOrderPage | public |
| `/wishlist` | WishlistPage | login required |
| `/login` | LoginPage | public |
| `/signup` | SignupPage | public |
| `/forgot-password` | ForgotPasswordPage | public |
| `/reset-password` | ResetPasswordPage | via email link |
| `/account` | AccountPage (profile) | login required |
| `/account/orders` | AccountOrdersPage | login required |
| `/account/orders/:orderNumber` | OrderDetailPage | login required (own orders) |
| `/account/addresses` | AddressesPage | login required |
| `/about` | AboutPage | public |
| `/contact` | ContactPage | public |
| `/policy/:slug` | PolicyPage (`shipping-returns`, `privacy`, `terms`) | public |
| `*` | NotFoundPage | public |

### Admin (`/admin/*`, roles: **O** = owner only, **S+O** = staff and owner)
| Route | Page | Role |
|---|---|---|
| `/admin/login` | AdminLoginPage | public (rejects non-staff) |
| `/admin` | AdminDashboardPage | S+O |
| `/admin/products` | AdminProductsPage | S+O |
| `/admin/products/new` | AdminProductFormPage | S+O |
| `/admin/products/:id/edit` | AdminProductFormPage | S+O |
| `/admin/categories` | AdminCategoriesPage | S+O (staff view only) |
| `/admin/orders` | AdminOrdersPage | S+O |
| `/admin/orders/:id` | AdminOrderDetailPage | S+O |
| `/admin/orders/:id/print` | AdminOrderPrintPage (invoice + packing slip) | S+O |
| `/admin/payment-proofs` | AdminPaymentProofsPage | S+O |
| `/admin/returns` | AdminReturnsPage | S+O |
| `/admin/customers` | AdminCustomersPage | S+O (view) |
| `/admin/reviews` | AdminReviewsPage | S+O |
| `/admin/messages` | AdminMessagesPage | S+O |
| `/admin/coupons` | AdminCouponsPage | O |
| `/admin/banners` | AdminBannersPage | O |
| `/admin/delivery` | AdminDeliveryPage | O |
| `/admin/reports` | AdminReportsPage | O |
| `/admin/staff` | AdminStaffPage | O |
| `/admin/settings` | AdminSettingsPage | O |

## 2. Global Layout & Navigation
- **Header:** logo (links to `/`), category menu (mega-menu on desktop, drawer on mobile), search bar with AI-search toggle, language switch (EN | اردو), wishlist icon, account icon (login or account menu), cart icon with live count (opens CartDrawer).
- **AnnouncementBar:** text from `store_settings.announcement_en/ur` (hidden if empty).
- **Footer:** quick links, policies, contact details, TikTok + Facebook links, payment methods icons (COD, JazzCash, Easypaisa, Bank), copyright.
- **Floating:** WhatsApp button (every page), AI Assistant button (storefront pages, not checkout success).
- **Page transitions:** animated route change (see 04 doc). Scroll restored to top on navigation.
- **Language:** switching sets `dir="rtl"` for Urdu and persists the choice in `localStorage`.
- **Demo badge:** shown only in demo mode.

## 3. Customer Flows

### 3.1 Browse → Product
1. Home → category tile / hero button → `CategoryPage` or `ShopPage`.
2. Filters (category, size, color, price range, fabric, in stock, on sale) + sort; state kept in URL query params (shareable links).
3. Product card hover/tap: second image, quick-add (opens size picker), wishlist heart.
4. `ProductPage`: choose size + color → price/stock updates → **Add to cart** (item flies to cart icon, drawer opens) or **Order on WhatsApp** (opens `wa.me` with a prefilled message containing product name, size, color, link).
5. **Smart Size Recommendation:** button "Find my size" → height, weight, fit (slim/regular/loose) → recommended size highlighted (rule-based from `size_charts`) + optional AI explanation.
6. Reviews tab: list of approved reviews, AI summary at top (if exists), "Write a review" (shown only to verified buyers).

### 3.2 AI Search & Assistant
- **AI Search:** typing a sentence (≥ 3 words) offers "Search with AI". Result: filters applied to the product grid + chips showing what was understood ("Waistcoat · Black · under Rs. 5,000"). If quota exceeded → normal keyword search with a small notice.
- **Assistant widget:** floating button → chat panel. Greeting + 3 suggestion chips ("Shadi ke liye kya pehnu?", "Winter jackets", "Delivery kitne din?"). Replies may include product cards. Quota exceeded → fallback message + WhatsApp button. Conversation kept in memory only (cleared on refresh).

### 3.3 Cart
1. Cart lives in `localStorage` (`arts_cart`) as `[{variant_id, product_id, quantity}]`; display data is refetched live.
2. Cart drawer + `/cart` page: change quantity (max = stock), remove, see subtotal, apply coupon (`validate_coupon`), choose city for delivery estimate (`get_delivery_charge`).
3. Items that became unavailable or out of stock are flagged and must be fixed before checkout.
4. Empty state: illustration + "Shop new arrivals" button.

### 3.4 Checkout (guest first)
1. `/checkout` shows form + order summary. If logged in: prefill name/phone/email, offer saved addresses.
2. Fields: full name, mobile (validated), email (optional), city (select), address, notes.
3. Delivery charge updates when the city changes; coupon can be applied here too.
4. Payment method picker (only enabled methods):
   - **COD** → no extra step.
   - **JazzCash / Easypaisa / Bank transfer** → card shows account title + number (+ IBAN for bank), copy button, instruction text; **PaymentProofUploader** (screenshot required, transaction ID optional).
5. **Place order** → `place_order` RPC (re-validates everything). Possible results:
   - Success → (if proof method: upload screenshot to `payment-proofs/{order_id}/...` and create `payment_proofs` row) → clear cart → `/order-success/:orderNumber`.
   - Stock/price changed → message listing affected items, cart updated, user retries.
   - Coupon invalid → coupon removed with message, totals refreshed.
   - Rate limited → "Too many orders, please contact us on WhatsApp".
   - Upload failed after order creation → order is kept; success page shows "Upload your payment screenshot" retry (using order number + phone on TrackOrderPage).
6. **OrderSuccessPage:** animated confirmation, order number (copy), summary, payment instructions recap, "Track order" button, and for guests a card: "Create an account to track orders and reorder faster" (email prefilled → `/signup`).

### 3.5 Track Order
- `/track-order`: inputs order number + phone → `track_order` RPC → status timeline (`pending → confirmed → processing → shipped → delivered`), courier name + tracking number when present, items, totals, payment status.
- Actions on this page: **Cancel order** (only if `pending`/`confirmed`, with confirm modal and reason), **Upload payment proof** (if proof method and none uploaded), WhatsApp help.
- Wrong combination → "We couldn't find an order with these details" (no hint which field is wrong).

### 3.6 Account Flows
- **Signup:** name, email, password (≥ 8 chars), phone optional → confirmation email message ("Check your email") → login. After first login, `link_guest_orders` attaches previous guest orders with the same verified email.
- **Login:** email + password; link to forgot password; optional Google button; redirect back to the page the user came from (default `/account`).
- **Forgot/Reset password:** email → link → ResetPasswordPage → success → login.
- **Account:** edit name/phone/language; **Addresses** CRUD with default; **Orders** list with status badges → **OrderDetailPage** with timeline, cancel (if allowed), **Request return** (delivered + inside return window; reason required), review buttons for delivered items.
- **Wishlist:** heart toggles for logged-in users; guests clicking the heart see a login prompt (modal) and the product is added after login.

### 3.7 Contact & Info
- ContactPage: form (name, phone, email optional, message) → `contact_messages` insert → success state. Also shows address, phone/WhatsApp, email, socials, map link (Google Maps search link for the address).
- About and Policy pages: content from i18n files (editable later by developer; not part of admin v1).

## 4. Admin Flows

### 4.1 Access
- `/admin/login`: email + password. After login, if `profiles.role` is not `staff`/`owner` → sign out + "This account has no admin access". Successful → `/admin`.
- Any `/admin/*` visit when logged out → redirect to `/admin/login`; wrong role for an owner-only page → "Not allowed" screen with link back to dashboard.
- Session expiry → redirect to login with return path.

### 4.2 Layout
Left sidebar (collapses to bottom/drawer menu on mobile) showing only the items allowed for the role; top bar with user name, role badge, "View store" link, logout.

### 4.3 Dashboard
Cards: today's sales (owner), today's new orders, pending orders, awaiting payment verification, low-stock count. Lists: latest 10 orders, low-stock variants (with quick "update stock"), top 5 selling products (owner). Data from `admin_dashboard_stats`.

### 4.4 Products
1. List with search, category filter, status filter, low-stock highlight, pagination.
2. **Add/Edit (AdminProductFormPage):** sections — Basics (names EN/UR, category, slug auto, fabric), Pricing (base price, sale price), Descriptions (EN/UR) with **AI Writer panel** (Generate description / Translate / SEO + tags — each shows result in a preview the admin can accept or edit), Images (multi-upload, drag reorder, first = main, alt text), Variants (table: size, color, SKU, stock, optional price override, active) with quick generator (select sizes × colors), Flags (featured, new arrival, active), SEO.
3. Save → success toast; validation errors shown inline. Delete (owner only) requires confirm; products with orders are **deactivated** instead of deleted (`is_active = false`).

### 4.5 Orders
1. List filters: status, payment method, payment status, city, date range, search by order number/phone/name.
2. **AdminOrderDetailPage:** customer + address, items, totals, payment info + proof thumbnail, status history. Actions: change status (with optional note, validated against allowed transitions), set courier name + tracking number, mark payment status, cancel (restores stock), print.
3. `/admin/orders/:id/print`: clean printable invoice + packing slip (A4, black & white friendly, store logo/details from settings) with a Print button.
4. Status change inserts an `order_status_history` row automatically.

### 4.6 Payment Proofs & Returns
- **Payment proofs:** queue of `pending` proofs with large screenshot viewer (signed URL), order summary, amount, transaction ID → **Approve** (sets proof `approved`, order `payment_status = paid`) or **Reject** (reason; order `payment_status = failed`; customer must contact store/WhatsApp or re-upload).
- **Returns:** list by status → open request → approve/reject/complete with note.

### 4.7 Owner-only Management
- **Coupons:** table + form (code, type, value, min order, max discount, usage limit, start/end, active). Used count read-only.
- **Banners:** list with drag order, image upload to `site-images`, EN/UR title + subtitle, link, active toggle.
- **Delivery:** editable city table (city, charge, estimated days, active) + default charge + free-delivery threshold.
- **Reports:** date range → sales totals, orders count, average order value, best sellers, payment-method split, city split, daily chart; **Export CSV**.
- **Staff:** list of staff/owner users; "Add staff" = enter the email of an existing registered user → `set_user_role(email, 'staff')`; demote back to `customer`. An owner cannot demote themselves if they are the last owner.
- **Settings:** tabs — Store info, Social links, Payments (accounts + toggles), Orders (low-stock threshold, return window, free delivery), Announcement bar.

### 4.8 Reviews & Messages
- Reviews: pending first; approve/hide/delete; button "Refresh AI summary" per product.
- Messages: inbox list, view, mark handled.

## 5. UI States (apply everywhere)
| State | Behavior |
|---|---|
| Loading | Skeleton blocks for lists/cards; CrosshairLoader for full-page; buttons show spinner and disable |
| Empty | Friendly message + clear next action (e.g. "No orders yet — start shopping") |
| Error | Plain-language message + Retry button; never show raw errors |
| Success | Toast (auto-dismiss 4 s) or inline confirmation |
| Offline/slow | Banner "Connection problem"; actions retry |
| AI quota exceeded | Fallback notice + WhatsApp button (never blocks the page) |
| Forbidden | "You don't have access to this page" with back link |
| Out of stock | Disabled size/color, "Out of stock" badge, optional "Ask on WhatsApp" |

## 6. Permissions Summary (UI + RLS must agree)
- Public read: active categories, active products/variants/images, size charts, active banners, active delivery rates, approved reviews, review summaries, **non-secret** store settings.
- Customer: own profile, addresses, wishlist, orders (via RPC/select own), return requests, reviews.
- Staff/Owner: operational tables per matrix in PRD §4.3.
- Owner only: settings write, coupons, banners, delivery, reports, staff roles, product/category delete.
