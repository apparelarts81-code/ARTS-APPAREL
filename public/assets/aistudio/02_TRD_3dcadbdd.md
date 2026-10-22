# 02 — Technical Requirements Document (TRD)
**Project:** ARTS APPAREL — Online Men's Clothing Store

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | **React 18 + TypeScript + Vite** (SPA) |
| Styling | Tailwind CSS (core utilities) + CSS variables for design tokens |
| Animation | `motion` (Framer Motion) + CSS animations; respect `prefers-reduced-motion` |
| Routing | `react-router-dom` v6 |
| Server state | `@tanstack/react-query` |
| Forms/validation | `react-hook-form` + `zod` |
| Icons | `lucide-react` |
| i18n | Lightweight own `LanguageProvider` + JSON dictionaries (`en`, `ur`), RTL via `dir` attribute |
| Backend / DB / Auth / Storage | **Supabase** (PostgreSQL, Auth, Storage) |
| AI | **Cloudflare Workers AI** (free plan) called only from server-side Cloudflare endpoints |
| Hosting | **Cloudflare only** (Workers & Pages, deployed from GitHub) |
| Source control | GitHub (AI Studio "Export to GitHub") |

Vercel is **not** used. The Supabase database is **not** created by AI Studio — the code must be Supabase-ready; the real project/database is created later (ChatGPT + Supabase plugin) from `05_Backend_Schema.md`.

## 2. Architecture

```
Browser (React SPA, Cloudflare Pages)
   │
   ├── Supabase JS client (publishable key, user JWT) ──► Supabase: Auth, Postgres (RLS), Storage, RPC functions
   │
   └── fetch('/api/...') ──► Cloudflare server endpoints (Pages Functions / Worker)
                               ├── verify user JWT with Supabase (for admin AI endpoints)
                               ├── read catalog/settings from Supabase
                               ├── quota check (RPC consume_ai_quota, service role, server only)
                               └── Workers AI binding (env.AI) [optionally via AI Gateway]
```

Principles
- All business-critical writes (placing orders, coupon validation, delivery charge, stock, cancel, review submit, role changes) go through **Postgres RPC functions** (`SECURITY DEFINER`, validated inside) — the frontend never computes trusted totals.
- Reads of public catalog data use direct table queries under RLS.
- The only server code outside Supabase is the small AI endpoint layer (Section 9).

## 3. Frontend Folder Structure

```
/
├── index.html
├── package.json
├── package-lock.json            (must exist; NO bun.lock / bun.lockb)
├── .npmrc                       (content: legacy-peer-deps=true)
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts / postcss.config.js
├── public/
│   ├── _redirects               (content: /*  /index.html  200)
│   ├── favicon.svg
│   └── robots.txt
└── src/
    ├── main.tsx, App.tsx, routes.tsx
    ├── lib/
    │   ├── supabase.ts          (client from env vars; exports isDemoMode)
    │   ├── format.ts            (formatPKR, formatDate, normalizePhone)
    │   ├── validators.ts        (zod schemas)
    │   └── constants.ts         (order statuses, payment methods, etc.)
    ├── i18n/ (LanguageProvider.tsx, en.json, ur.json, useT.ts)
    ├── types/ (database.ts matching 05_Backend_Schema.md exactly)
    ├── services/                (ALL data access; one file per area)
    │   ├── catalogService.ts    (categories, products, variants, search, filters)
    │   ├── cartService.ts       (localStorage cart helpers)
    │   ├── orderService.ts      (placeOrder, trackOrder, cancelOrder, myOrders)
    │   ├── couponService.ts, deliveryService.ts
    │   ├── authService.ts, profileService.ts, addressService.ts
    │   ├── wishlistService.ts, reviewService.ts, returnService.ts
    │   ├── settingsService.ts, bannerService.ts, contactService.ts
    │   ├── storageService.ts    (uploads: product-images, site-images, payment-proofs)
    │   ├── aiService.ts         (calls /api/ai/*, handles quota/fallback)
    │   └── admin/ (adminProductService, adminOrderService, adminReportService,
    │              adminCouponService, adminDeliveryService, adminStaffService, adminSettingsService ...)
    ├── demo/ (demoData.ts — sample categories, products, variants, banners, settings, orders)
    ├── context/ (AuthContext, CartContext, WishlistContext, SettingsContext, ToastContext)
    ├── hooks/ (useAuth, useCart, useDebounce, useReducedMotion, useRoleGuard ...)
    ├── components/
    │   ├── layout/ (Header, Footer, AnnouncementBar, MobileNav, WhatsAppButton, PageTransition)
    │   ├── ui/ (Button, Input, Select, Modal, Drawer, Badge, Skeleton, Toast, Tabs, Rating, EmptyState, ErrorState, CrosshairLoader)
    │   ├── store/ (ProductCard, ProductGrid, FilterPanel, SortSelect, SizeSelector, ColorSwatches, ImageGallery, SizeChartModal, SizeRecommender, CartDrawer, CartItemRow, CouponBox, CheckoutForm, PaymentMethodPicker, PaymentProofUploader, OrderTimeline, ReviewList, ReviewForm, WishlistButton, CategoryTile, HeroSlider)
    │   ├── ai/ (AIAssistantWidget, AISearchBar, AIFallbackNotice)
    │   └── admin/ (AdminLayout, AdminSidebar, StatCard, DataTable, ProductForm, VariantEditor, ImageUploader, OrderStatusSelect, ProofReviewer, PrintableInvoice, AIWriterPanel ...)
    └── pages/
        ├── (storefront) HomePage, ShopPage, CategoryPage, ProductPage, CartPage, CheckoutPage,
        │   OrderSuccessPage, TrackOrderPage, WishlistPage, LoginPage, SignupPage,
        │   ForgotPasswordPage, ResetPasswordPage, AccountPage, AccountOrdersPage,
        │   OrderDetailPage, AddressesPage, AboutPage, ContactPage, PolicyPage, NotFoundPage
        └── admin/ AdminLoginPage, AdminDashboardPage, AdminProductsPage, AdminProductFormPage,
            AdminCategoriesPage, AdminOrdersPage, AdminOrderDetailPage, AdminOrderPrintPage,
            AdminPaymentProofsPage, AdminReturnsPage, AdminCustomersPage, AdminCouponsPage,
            AdminBannersPage, AdminReviewsPage, AdminDeliveryPage, AdminReportsPage,
            AdminMessagesPage, AdminStaffPage, AdminSettingsPage
```

Rules: components never call Supabase directly — only `services/*`. Page/route names in this file are the canonical names used in `03_App_Flow.md` and `06_Implementation_Plan.md`.

## 4. Supabase Integration Strategy

`src/lib/supabase.ts`:
```ts
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isDemoMode = !url || !key;
export const supabase = isDemoMode ? null : createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
```
- **Never hardcode** keys. No service-role key anywhere in frontend code or repo.
- **Demo mode** (`isDemoMode === true`): every service returns data from `src/demo/demoData.ts` and keeps changes in memory; a fixed "DEMO MODE" badge is shown; demo login accepts any credentials and lets the tester switch between customer / staff / owner for UI testing. Demo mode contains no real data, so it exposes nothing. When the Supabase variables are present, demo code paths are not used.
- Services return typed results and throw typed errors `{ code, message }`; UI shows friendly messages (never raw SQL errors).
- Table and column names in `src/types/database.ts` and all queries must match `05_Backend_Schema.md` **exactly**.
- RPC names used by the frontend (exact): `place_order`, `track_order`, `cancel_order`, `add_payment_proof`, `review_payment_proof`, `validate_coupon`, `get_delivery_charge`, `submit_review`, `link_guest_orders`, `request_return`, `set_user_role`, `admin_dashboard_stats`, `admin_sales_report`, `admin_customers_list`. (Server-only, never called from the browser: `consume_ai_quota`.) Exact parameters are in `05_Backend_Schema.md` §3.

## 5. Authentication & Authorization
- Supabase Auth: email + password; optional Google OAuth (button shown only if `VITE_GOOGLE_AUTH_ENABLED === "true"`).
- Email confirmation: ON by default in Supabase (owner may change later). Password reset via email link → `/reset-password`.
- On signup a DB trigger creates the `profiles` row with `role = 'customer'`.
- `AuthContext` loads `profiles.role`. **Route guards:** `RequireAuth` (customer pages), `RequireRole(['staff','owner'])` for `/admin/*`, `RequireRole(['owner'])` for owner-only admin pages. UI guards are convenience only; **RLS is the real protection**.
- Roles: `customer`, `staff`, `owner`. Role changes only via `set_user_role` RPC (owner only). A user can never edit their own role.
- Guests: no auth; may call `place_order`, `track_order`, `cancel_order`, `add_payment_proof`, `validate_coupon`, `get_delivery_charge`, insert into `contact_messages`, upload to `payment-proofs`.

## 6. Storage Strategy

| Bucket | Public read | Who writes | Notes |
|---|---|---|---|
| `product-images` | Yes | staff, owner | path `{product_id}/{uuid}.webp|jpg`; max 3 MB; images compressed client-side to ≤ 1600px before upload |
| `site-images` | Yes | owner | banners, category images, about page |
| `payment-proofs` | **No** | anon + authenticated may **insert only**; staff/owner read via signed URL | path `{order_id}/{uuid}.jpg|png`; max 5 MB; image types only |

Store the object **path** in the DB (`payment_proofs.screenshot_path`) and generate signed URLs in the admin UI. Public images store full public URL or path + helper `getPublicUrl()`.

## 7. Security Requirements
1. RLS enabled on **all** public tables; policies in 05_Backend_Schema.md.
2. Server-side price, stock, coupon and delivery calculation inside `place_order`.
3. No secrets in frontend or GitHub; Cloudflare secrets for server keys.
4. Input validation on client (zod) **and** server (RPC checks/constraints).
5. Rate limits: AI endpoints (Section 9); order placement limited per phone/IP window inside `place_order` (e.g. max 5 orders per phone per hour).
6. Admin UI hides forbidden actions per role; database enforces them.
7. Sanitized rendering: never use `dangerouslySetInnerHTML` with user/AI text.
8. File uploads: type and size checks client-side + bucket restrictions.
9. CORS: AI endpoints only accept requests from the site's own origin.
10. Do not log personal data (phone/address) in AI endpoints.

## 8. Cloudflare Deployment Requirements
- Deploy from GitHub via **Cloudflare Workers & Pages**.
- **Build command:** `npm run build`  |  **Output directory:** `dist`  |  Framework preset: Vite/React.
- SPA fallback: `public/_redirects` containing `/*  /index.html  200` so refresh on any route never returns 404.
- Root `.npmrc` with `legacy-peer-deps=true`; only `package-lock.json` (no `bun.lock`/`bun.lockb`).
- Pin a compatible Node version (add `"engines": {"node": ">=18"}` and, if needed, `NODE_VERSION` env var).
- Environment variables must be set **before** the first deploy (Vite reads them at build time) — see Section 10.
- Testing happens on the Cloudflare free subdomain; the domain `artsapparelsdk.com` is attached later from the Cloudflare dashboard (update `VITE_SITE_URL` and Supabase Auth redirect URLs then).
- Supabase Auth settings to configure after deploy: Site URL and Redirect URLs = Cloudflare subdomain (and later the custom domain).

## 9. AI Requirements (Cloudflare Workers AI, free plan)

**Free allocation:** 10,000 neurons/day (resets 00:00 UTC). A short chat answer on a small instruct model costs roughly 50–100 neurons, so budget ≈ 100–150 AI calls per day in total. Therefore **all AI usage is capped** and every feature has a fallback (PRD §4.2). Never let usage exceed the free allocation.

**Where AI runs:** server-side Cloudflare endpoints with the Workers AI binding named `AI`; optionally routed through Cloudflare AI Gateway (`AI_GATEWAY_ID`) for logging/caching. The exact Cloudflare file structure (Pages Functions vs Worker) and binding setup will be confirmed in the later "AI Services" step using Cloudflare's official guidance; the frontend contract below must not change.

**Endpoints (frontend → server), all `POST`, JSON, same-origin:**

| Endpoint | Caller | Request | Response |
|---|---|---|---|
| `/api/ai/chat` | public | `{ messages: [{role, content}] (last 6 max), language: "en"|"ur" }` | `{ reply: string, products: [{id, slug, name, price}] , quotaExceeded?: boolean }` |
| `/api/ai/search` | public | `{ query: string }` | `{ filters: { category_slug?, color?, size?, max_price?, min_price?, keywords?: string[] }, quotaExceeded?: boolean }` |
| `/api/ai/size-explain` | public | `{ height_cm, weight_kg, fit, recommended_size }` | `{ text: string, quotaExceeded?: boolean }` |
| `/api/ai/describe` | staff/owner (Bearer JWT) | `{ name, category, fabric, points: string[] }` | `{ description_en, description_ur }` |
| `/api/ai/translate` | staff/owner | `{ text, from: "en"|"ur", to: "ur"|"en" }` | `{ text }` |
| `/api/ai/seo` | staff/owner | `{ name, category, description }` | `{ seo_title, seo_description, tags: string[] }` |
| `/api/ai/review-summary` | staff/owner | `{ product_id }` | `{ summary_en, summary_ur }` (server also writes `review_summaries`) |

**Server rules**
1. Verify the Supabase JWT for staff/owner endpoints and check `profiles.role`.
2. Call RPC `consume_ai_quota(scope_key, daily_limit)` before every model call: scopes `global_public`, `global_admin`, `ip:<hash>`, `user:<id>`. If denied return `{ quotaExceeded: true }` with HTTP 200 (frontend shows the fallback).
3. Chat/search/size prompts include **only** data fetched from Supabase (catalog rows, store settings) and a strict system prompt: answer only about ARTS APPAREL, never invent products/prices/stock/policies, keep answers short, reply in the user's language (English, Urdu, or Roman Urdu).
4. Limit input length (≤ 500 chars/message) and output tokens (≤ 300 for chat).
5. Search/size/chat responses must not include personal data.
6. Model id from env `AI_TEXT_MODEL` (default a small Llama-class instruct model available on Workers AI); never hardcode in multiple places.
7. Never expose the Cloudflare/AI keys or the Supabase service-role key to the browser.

**Frontend (`aiService.ts`)**: timeouts (15 s), one retry max, handles `quotaExceeded` and network errors by showing `AIFallbackNotice` (with WhatsApp button) or silently falling back (search → keyword search; size → rule-based text). In demo mode return canned sample replies.

## 10. Environment Variables (complete list)

**Frontend (Vite, build-time, set in Cloudflare build variables)**

| Name | Required | Where from |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase → API keys → publishable (anon) key |
| `VITE_SITE_URL` | Yes | Cloudflare subdomain now, `https://artsapparelsdk.com` later |
| `VITE_GOOGLE_AUTH_ENABLED` | No | `"true"` only after Google OAuth is configured in Supabase |

**Server (Cloudflare — secrets / bindings, NOT `VITE_`, never in GitHub)**

| Name | Type | Purpose |
|---|---|---|
| `SUPABASE_URL` | variable | Same project URL, for server endpoints |
| `SUPABASE_PUBLISHABLE_KEY` | variable | Verify user JWT / read public data |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** | Only for `consume_ai_quota` and writing `review_summaries` |
| `AI` | Workers AI binding | Model access |
| `AI_TEXT_MODEL` | variable | Workers AI text model id |
| `AI_GATEWAY_ID` | variable (optional) | AI Gateway name |
| `AI_DAILY_PUBLIC_LIMIT` | variable | default `100` (calls/day for all visitors combined) |
| `AI_DAILY_ADMIN_LIMIT` | variable | default `40` (reserved for staff tools) |
| `AI_PER_IP_DAILY_LIMIT` | variable | default `8` |
| `AI_PER_USER_DAILY_LIMIT` | variable | default `15` |

## 11. Performance & Quality
- Route-level `React.lazy` + `Suspense` (admin bundle separate from storefront).
- Images: `loading="lazy"`, explicit width/height, responsive `srcset` where possible, WebP preferred, skeleton placeholders.
- Pagination or infinite load (24 products per page); debounce search (300 ms).
- React Query caching for catalog/settings (5 min stale time).
- Animations use `transform`/`opacity` only; disable heavy effects on low-end devices / `prefers-reduced-motion`.
- Error boundary at app root and around admin pages; friendly 404.

## 12. Third-party Services Summary
Supabase (DB/Auth/Storage) · Cloudflare (hosting + Workers AI + optional AI Gateway) · GitHub (source) · Google Fonts (typography; fonts listed in 04_UI_UX_Design_Brief.md) · PhotoToURL (temporary image hosting during the images workflow only).
