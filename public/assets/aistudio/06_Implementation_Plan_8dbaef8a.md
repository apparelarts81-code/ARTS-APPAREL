# 06 — Implementation Plan (for Google AI Studio)
**Project:** ARTS APPAREL — Online Men's Clothing Store

**How this file is used:** The owner uploads all 6 files (`01_PRD.md` … `06_Implementation_Plan.md`) and sends only: `Follow the plan`. **Build the complete website in one run** following the order below. This is an internal execution plan — there are no phase-wise prompts from the user. If time/quota runs out, continue exactly from the first unfinished item in the order below (do not restart, do not rewrite finished files).

---

## 0. Ground Rules (read first)

1. Build **React + TypeScript + Vite** exactly per `02_TRD.md` (folder structure, services layer, route/page names, env variable names).
2. **Do not create or call a real Supabase project now.** Write Supabase-ready code that reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. When they are missing, run in **Demo Mode** with sample data (`src/demo/demoData.ts`) and a visible "DEMO MODE" badge so every page and every admin screen is testable right now.
3. Table, column, RPC, enum and storage bucket names must match `05_Backend_Schema.md` **exactly** (put them in `src/types/database.ts` and `src/lib/constants.ts`).
4. Follow `04_UI_UX_Design_Brief.md` strictly: black/red/white tokens, Bodoni Moda + Hanken Grotesk (+ Noto Nastaliq Urdu / Naskh for Urdu), the Tie Line, Target Lock crosshair, the full animation plan, RTL for Urdu, mobile-first.
5. Follow `03_App_Flow.md` for every route, flow and UI state.
6. Never hardcode keys or secrets. No service-role key. No `localStorage` for anything except: cart (`arts_cart`), language (`arts_lang`), intro-seen flag (`arts_intro_seen`), demo-mode state.
7. No placeholder lorem ipsum: use real ARTS APPAREL copy (English + Urdu) and the real business details from `01_PRD.md` §2.
8. Where real images do not exist yet, use charcoal placeholder blocks with the crosshair mark. Images are integrated later in a separate step.
9. Keep components typed, small and reusable; all data access only through `src/services/*`.
10. Quality floor: responsive from 360px, keyboard focus visible, `prefers-reduced-motion` respected, loading/empty/error states everywhere.

## 1. Build Order (internal; do it in one run)

### Step 1 — Project setup
- Vite + React + TS, Tailwind, `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `zod`, `motion`, `lucide-react`, `@supabase/supabase-js`.
- Files: `package.json` (scripts: `dev`, `build` = `tsc -b && vite build` or `vite build`, `preview`; `engines.node >= 18`), **`package-lock.json`** (no `bun.lock`/`bun.lockb`), **`.npmrc`** (`legacy-peer-deps=true`), `public/_redirects` (`/*  /index.html  200`), `public/robots.txt`, `public/favicon.svg`, `index.html` with Google Fonts and meta tags, `.env.example` listing the frontend variables from `02_TRD.md` §10 (empty values), `.gitignore` (includes `.env`, `.env.local`).
- Verify `npm run build` produces `dist`.

### Step 2 — Foundation
- `src/lib/*` (supabase client + `isDemoMode`, format helpers: `formatPKR`, `normalizePhone`, `validators`), `types/database.ts`, constants (statuses, payment methods, cities fallback).
- Design tokens in CSS variables + Tailwind theme extension; global styles, font loading, base typography, focus styles, reduced-motion rules.
- `i18n/` with `en.json` and `ur.json` (all UI strings, policy text, About text), `LanguageProvider` (sets `lang`/`dir`, persists), `useT`.
- Contexts: Auth, Cart, Wishlist, Settings, Toast. React Query provider. Error boundary.
- `demo/demoData.ts`: the 11 categories, ≥ 24 sample products across categories (names in EN/UR, fabric, base/sale price in realistic PKR, 2–4 variants each with sizes/colors/stock, some low/out of stock), 3 banners, settings from PRD §2, delivery rates, size charts, sample reviews, sample orders in every status, sample coupons (e.g. `WELCOME10`), sample payment proofs, sample staff/customers.

### Step 3 — UI kit & layout
- `components/ui/*` (Button, Input, Select, Textarea, Modal, Drawer, Badge, Skeleton, Toast, Tabs, Accordion, Rating, EmptyState, ErrorState, QuantityStepper, **CrosshairLoader**, **TieLine**, ConfirmDialog).
- `components/layout/*`: AnnouncementBar, Header (mega-menu, search, language switch, icons, scroll behavior), MobileNav drawer, Footer, WhatsAppButton, PageTransition, ScrollToTop, intro splash (first visit per session, skippable).
- `routes.tsx` with lazy-loaded pages, `RequireAuth`, `RequireRole`, admin layout route group, NotFound.

### Step 4 — Services (data layer) with demo fallbacks
Implement every service listed in `02_TRD.md` §3 against Supabase (tables/RPC names from `05_Backend_Schema.md`) **and** a demo implementation behind `isDemoMode`. Include: catalog queries with filters/sort/pagination/search; cart helpers; `placeOrder` (calls RPC `place_order`, then uploads proof to `payment-proofs` and calls `add_payment_proof` when applicable); `trackOrder`, `cancelOrder`; coupon/delivery RPC wrappers; auth (signup, login, logout, reset, optional Google); profile/address/wishlist/review/return services; settings/banners/contact; storage upload helpers (client-side image compression to ≤ 1600px); admin services for products/variants/images, orders (status, courier, tracking, payment status), payment proofs (`review_payment_proof`), returns, customers (`admin_customers_list`), coupons, banners, delivery, reports (`admin_sales_report`, CSV export), staff (`set_user_role`), settings, messages, dashboard (`admin_dashboard_stats`). Map RPC error codes (`OUT_OF_STOCK`, `COUPON_INVALID`, `RATE_LIMITED`, `PAYMENT_METHOD_DISABLED`) to friendly bilingual messages.
- `aiService.ts`: functions for all endpoints in `02_TRD.md` §9 with timeout, one retry, `quotaExceeded` handling and demo canned responses. **Do not build the server endpoints now** (they are added in the later AI Services step) — the service must simply call `/api/ai/*` and degrade gracefully if the endpoint is missing (404/network error → treat like quota exceeded).

### Step 5 — Storefront pages & components
Build in this order, each complete with states and animations from the design brief:
1. **HomePage** (hero from banners, category tiles, new arrivals, best sellers, sale, brand statement, occasion strip, trust row).
2. **ShopPage** + **CategoryPage** (FilterPanel desktop / bottom sheet mobile, URL-synced filters, sort, pagination, skeletons, AI search bar with understood-filter chips).
3. **ProductPage** (gallery + zoom, variant selection, stock logic, price logic, size chart modal, **SizeRecommender** rule-based using `size_charts` data, WhatsApp order button, reviews list + AI summary block, related products, sticky mobile bar).
4. **Cart** (CartDrawer + CartPage, coupon box, delivery estimate by city).
5. **CheckoutPage** (guest-first form, saved addresses for logged-in, PaymentMethodPicker with account details + copy buttons, PaymentProofUploader, place order, error mapping) and **OrderSuccessPage** (animation, guest "create account" card).
6. **TrackOrderPage** (timeline, cancel, upload proof).
7. **Auth pages** (Login, Signup, ForgotPassword, ResetPassword) with `link_guest_orders` after login.
8. **Account** (AccountPage, AccountOrdersPage, OrderDetailPage with cancel/return/review, AddressesPage), **WishlistPage**.
9. **About, Contact, PolicyPage** (shipping-returns, privacy, terms; written for a Pakistani clothing store: COD, city-wise delivery, 7-day return window, payment verification for manual payments).
10. **AIAssistantWidget** (floating button, panel, suggestion chips, product cards, fallback notice with WhatsApp) wired to `aiService`.
11. SEO: `useDocumentMeta` hook per page (title, description, Open Graph), product JSON-LD on ProductPage.

### Step 6 — Admin panel
Build with `AdminLayout` (sidebar filtered by role, mobile bottom nav) and all pages listed in `03_App_Flow.md` §1 (Admin table): Login, Dashboard (stat cards with count-up, latest orders, low stock, top products — owner-only blocks hidden for staff), Products list + **ProductForm** (basics, pricing, bilingual descriptions, **AIWriterPanel** calling `aiService` describe/translate/seo, image uploader with reorder, **VariantEditor** with size × color generator, flags, SEO), Categories, Orders list + detail (status transitions per allowed flow, courier, tracking, payment status, history), **AdminOrderPrintPage** (invoice + packing slip with print CSS), Payment proofs (viewer + approve/reject), Returns, Customers, Reviews (+ refresh AI summary button), Messages, Coupons, Banners, Delivery, Reports (charts + CSV export), Staff, Settings (tabs).
- Staff vs owner permissions exactly per `01_PRD.md` §4.3; owner-only routes blocked for staff with a "Not allowed" screen.

### Step 7 — Polish
- Complete the animation plan (`04` §7): intro, hero, add-to-cart Target Lock + fly-to-cart, order-success, page transitions, scroll reveals, hover effects, count-ups, skeleton shimmer, marquee. Add the reduced-motion and low-end-device guards.
- Urdu pass: every string translated, RTL layout checked on all pages (logical CSS properties, mirrored icons, LTR prices/numbers).
- Accessibility pass (focus, labels, ARIA, alt text, contrast).
- Performance pass: route-level code splitting (admin separate), lazy images, memoization where lists are large.
- Remove dead code, console logs and unused dependencies.

### Step 8 — Self-QA (fix issues found, then finish)
Run through the checklist below in Demo Mode; fix anything failing before finishing. Then write `README.md` (project overview, env variables table, Cloudflare build settings, demo mode note, folder structure) and finish with a **Change Report** listing what was built and anything not completed.

## 2. Dependencies Between Parts
- Services + types must exist before pages. Cart context before ProductPage/Checkout. Settings context before Header/Footer/Checkout (WhatsApp, payment accounts). Auth context before route guards, Wishlist, Account, Admin. UI kit before every page.
- Admin product form depends on category service and storage service. Order detail depends on order status history and payment proof services. AI panels depend on `aiService` only.

## 3. Testing Checkpoints (Demo Mode)

**Storefront**
- [ ] Home loads with hero, tiles, product sections; Urdu switch flips to RTL with no layout breaks.
- [ ] Filters/sort/search work and persist in URL; AI search shows fallback gracefully when `/api/ai/search` is unavailable.
- [ ] Product: choose size/color → price/stock updates; out-of-stock variant disabled; size recommender returns a size; WhatsApp link opens `wa.me/923058165623` with message.
- [ ] Add to cart animation; cart persists after refresh; quantity limited by stock; coupon `WELCOME10` applies; city changes delivery charge.
- [ ] Guest checkout with COD completes → success page with order number; JazzCash/Easypaisa/Bank flows require screenshot; card method hidden.
- [ ] Track order with number + phone shows timeline; cancel only when allowed.
- [ ] Signup/login/forgot flows render with validation; account pages, addresses, wishlist, review, return request flows work.
- [ ] Contact form submits; policy/about pages render in both languages.
- [ ] AI assistant opens, answers in demo, and shows quota fallback with WhatsApp button.
- [ ] 404 page and error boundary work. Refresh on any deep link works (SPA fallback).

**Admin**
- [ ] Admin login rejects customer role; staff sees only allowed menu; owner sees all.
- [ ] Product create/edit with variants + images + AI writer; delete only for owner.
- [ ] Order status transitions follow the allowed flow; courier/tracking saved; print page prints cleanly.
- [ ] Payment proof approve/reject updates order payment status.
- [ ] Coupons, banners, delivery, settings, staff, reports (+ CSV) work for owner and are blocked for staff.

**Build/Deploy readiness**
- [ ] `npm run build` succeeds, output in `dist`; `public/_redirects` present; `package-lock.json` present, no bun lock files; `.npmrc` at root.
- [ ] No hardcoded keys; `.env.example` lists exactly the variables in `02_TRD.md` §10 (frontend part).
- [ ] No console errors; Lighthouse mobile performance reasonable; no horizontal scroll at 360px.

## 4. Final Checklist (before finishing)
1. All routes in `03_App_Flow.md` exist and render.
2. Names match `05_Backend_Schema.md` (tables, columns, enums, RPCs, buckets).
3. Real business details from `01_PRD.md` §2 used (name, phone/WhatsApp, email, address, TikTok, Facebook).
4. Colors, fonts, motion and RTL per `04_UI_UX_Design_Brief.md`.
5. Demo mode works with zero configuration; real mode only needs the Supabase env variables.
6. AI calls only via `/api/ai/*` through `aiService.ts`; no AI keys anywhere in the frontend.
7. Change Report produced.

## 5. Not Part of This Run (handled in later steps by the owner's workflow)
Images integration (separate Images workflow) · server-side AI endpoints on Cloudflare (AI Services step) · real Supabase project/database (ChatGPT + Supabase) · GitHub export · Cloudflare deployment · custom domain `artsapparelsdk.com`.
