# 04 — UI/UX Design Brief
**Project:** ARTS APPAREL — Online Men's Clothing Store

The owner asked for: **black + red + white theme from the logo, attractive animations everywhere, premium look, mobile-first.** Where this brief and any generic template habit disagree, this brief wins.

---

## 1. Design Concept — "Sharp Tailoring, Locked On Target"

The logo has two strong ideas: a **crisp white shirt with a red tie on pure black**, and a **crosshair-style "A"**. The whole site is built on those:

- **Black stage, white garment, one red accent.** Pages are mostly pure black or pure white sections; photography does the talking; red is used sparingly (primary buttons, sale tags, active states, the tie-line motif).
- **The Tie Line:** a thin vertical red line (2px, tapering to a point at the bottom like a tie) used as a section divider, loader accent and scroll-progress indicator.
- **Target Lock (signature interaction, used with restraint):** a crosshair ring that animates in (scale 1.4 → 1, opacity 0 → 1, 350 ms) when a user hovers a product image on desktop or presses "Add to cart" — the ring "locks" on the product, then the product flies to the cart. The same crosshair is the site's **CrosshairLoader** (rotating ring + cross lines). Do not put crosshairs anywhere else.

Tone: confident, tailored, local. Pakistani menswear for weddings, work and everyday.

## 2. Color Tokens (CSS variables on `:root`)

| Token | Hex | Use |
|---|---|---|
| `--color-black` | `#000000` | Hero, header, footer, dark sections (matches logo background) |
| `--color-charcoal` | `#161616` | Cards/panels on black, admin dark surfaces |
| `--color-red` | `#E31B23` | Primary buttons, sale badges, links on white, active states (white text on it = 4.7:1 contrast) |
| `--color-red-deep` | `#A8121A` | Hover/pressed state of red |
| `--color-white` | `#FFFFFF` | Light sections, text on black |
| `--color-silver` | `#9A9A9A` | Secondary text on black, crosshair-grey from logo, borders on black |
| `--color-line` | `#E6E6E6` | Borders/dividers on white |
| `--color-success` | `#1F8A4C` | In stock, paid, delivered |
| `--color-warning` | `#C77700` | Low stock, awaiting verification |

Rules: no gradients as decoration (one allowed: a black→transparent overlay on hero photos for text legibility). Alternate black and white sections down the page. Red text on black only for large sizes (≥ 20px); small red text appears on white.

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Display / headlines / prices in hero | **Bodoni Moda** (serif, high contrast, echoes the logo's serif caps) | weights 500–800; tight leading (1.05–1.15); used for H1–H3 and big numbers |
| UI / body / forms | **Hanken Grotesk** | weights 400/500/700; body 16px, line-height 1.6 (sans) |
| Urdu headings & product names | **Noto Nastaliq Urdu** | generous line-height (≥ 2.0) |
| Urdu body & UI | **Noto Naskh Arabic** | body 17px, line-height 1.9 |

Type scale (mobile → desktop): H1 40→72, H2 30→48, H3 22→30, body 16, small 14, caption 12. Line length ≤ 70 characters. Headlines are set in sentence case; **do not** use tracked-out ALL-CAPS eyebrow labels above headings, do not highlight a single random word in a headline, no "→" glued to every link. Product names in sentence/title case. Use Google Fonts with `display=swap` and fallbacks (`Georgia, serif` / `system-ui, sans-serif`).

## 4. Layout System
- 12-column grid, max content width 1280px; side padding 16px mobile / 32px desktop. Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72, 112.
- Breakpoints: 360 (small phone base), 640, 768, 1024, 1280.
- Radius: **buttons and inputs 6px; cards/images 4px; modals/drawers 12px** (different on purpose — sharp = tailored). No identical rounded-card-grid look for everything; product cards are image-first with no heavy borders or shadows.
- Shadows: almost none on black; on white a single soft shadow only for floating layers (drawer, modal, dropdown).
- Alignment: storefront text left-aligned (right-aligned automatically in Urdu RTL); centered text only for short hero lines and empty states.
- RTL: use logical CSS properties (`margin-inline-start`, `padding-inline-end`), mirror icons that imply direction, keep numbers/prices LTR.

## 5. Page Concepts

### 5.1 HomePage (top to bottom)
```
┌ Announcement bar (black, small white text) ───────────────┐
├ Header (black): logo | categories | search | EN/اردو | ♡ 👤 🛒 ┤
├ HERO (black, full viewport on mobile 85vh)                │
│   Left: big Bodoni headline + 1 sentence + red CTA        │
│   Right: tall photo of a model in the white-shirt/red-tie │
│   Tie Line draws down the left edge on load               │
├ Category tiles (white): horizontal scroll on mobile,      │
│   6-up grid on desktop, image zoom on hover               │
├ New Arrivals (white): product carousel                    │
├ Brand statement band (black): one big sentence, parallax  │
├ Best Sellers (white): grid                                │
├ Sale (black): products with red sale tags                 │
├ Occasion strip (white): "Wedding · Office · Eid · Casual" tiles
├ Reviews/trust row: delivery all Pakistan · COD · easy returns · WhatsApp support
├ Footer (black)                                            │
└ Floating: WhatsApp (bottom-left in RTL, bottom-right LTR) + AI assistant button
```
Hero content comes from `banners` (rotating slides, 5 s, pause on hover/touch).

### 5.2 ProductPage
```
Mobile: gallery (swipe, dots) → name + price → colors → sizes (+ Find my size) → Add to cart (sticky bottom bar) → details accordion → reviews → related
Desktop: [thumbnails | large image with zoom] | [info column sticky]
```
Price shows sale price in red with original struck through. Stock line: "Only 3 left" (warning color) when low. Size chart opens in a drawer. Sticky mobile bar shows price + Add to cart + WhatsApp icon.

### 5.3 ShopPage / CategoryPage
Left filter panel on desktop; bottom-sheet filters on mobile with an "Apply (24 results)" button. Active filter chips above the grid. Grid: 2 columns mobile, 3 tablet, 4 desktop. Skeleton cards while loading.

### 5.4 Cart / Checkout
Cart = right-side drawer (quick) and full page. Checkout: single page, form left, sticky summary right (stacked on mobile with a collapsible summary on top). Progress is shown as three simple steps: Details → Payment → Done, using the Tie Line as the progress rail.

### 5.5 Account, Track Order
Clean white pages. Order timeline is a vertical rail with dots; the current step pulses red; completed steps are filled black.

### 5.6 Admin Panel
Dark sidebar (charcoal) + light content area for readability. Compact tables with sticky headers, row hover highlight, status badges (color + text, never color alone), big touch-friendly buttons on mobile, bottom tab bar on phones for Orders / Products / Dashboard / More. Charts: simple bar/line in black + red + silver. Admin animations are minimal and fast (see §7).

## 6. Components (behavior & style)

- **Button:** primary = red fill/white text, hover red-deep + slight lift (translateY −1px), press scale .98; secondary = black fill; ghost = underline-on-hover; min height 44px; loading state with spinner; disabled at 50% opacity.
- **Inputs:** 48px height, 1px line border, focus ring 2px red + offset, floating-free labels above field, inline error text in red with an icon, success check on valid phone.
- **ProductCard:** 4:5 image, second image crossfade on hover, name (1–2 lines), price row, sale badge top-left (red, small), "New" badge (black), wishlist heart top-right, color dots (max 5 + count), quick-add bar sliding up on hover (desktop) / "+" button (mobile).
- **Badges/Status colors:** pending (silver), confirmed (black), processing (warning), shipped (red outline), delivered (success), cancelled (red fill), returned (charcoal). Always icon + text.
- **Modal/Drawer:** slide + fade, focus trapped, Esc closes, backdrop black 60%.
- **Toasts:** bottom-center (mobile) / top-right (desktop), black with white text, red edge for errors.
- **Tables (admin):** responsive — on mobile each row becomes a stacked card.
- **AI Assistant widget:** floating circular button (black with red ring), opens a bottom sheet on mobile / 380px panel on desktop; message bubbles (user = red, assistant = charcoal on black or light grey on white); product suggestions appear as compact cards; typing indicator = three dots; quota fallback card with WhatsApp button.
- **WhatsApp button:** green is **not** used; use the brand's black circle with a white WhatsApp glyph and a small red dot pulse to stay on-theme.

## 7. Motion & Animation Plan (owner wants animations everywhere)

Use `motion` (Framer Motion). Keep one consistent easing (`cubic-bezier(0.22, 1, 0.36, 1)`) and durations: micro 150–200 ms, standard 300–400 ms, hero 700–900 ms. Animate only `transform` and `opacity`. Everything below must be **disabled or reduced to simple fades when `prefers-reduced-motion` is on**.

**Orchestrated moments (make these excellent)**
1. **Site intro (first visit per session only, ≤ 1.6 s):** black screen → the crosshair ring draws in around the "A" mark → "ARTS APPAREL" fades up → screen splits upward into the home page. Skippable by click.
2. **Hero:** headline lines slide up with a staggered mask reveal; the model photo scales from 1.08 to 1 with slight parallax on scroll; Tie Line draws top to bottom.
3. **Add to cart:** Target Lock ring on the product image → image shrinks and flies along a curve to the cart icon → cart icon bounces and badge count ticks up.
4. **Order success:** a red tie-line draws, check mark morphs in, order number types in, subtle confetti of small red/white squares (once, 1.2 s).

**Everywhere else (subtle but present)**
- Page transitions: crossfade + 12px upward slide (250 ms).
- Scroll reveals: sections fade/slide in once as they enter the viewport; product grids stagger by 60 ms per item (max 8 items animated at once).
- Category tiles / product images: slow zoom (scale 1.06) on hover; text underline grows from the start edge.
- Header: shrinks and gains a black blur background after scrolling 40px; hides on scroll down, shows on scroll up (mobile).
- Buttons: lift + press feedback; red ripple on tap (mobile).
- Wishlist heart: scale pop + fill; Rating stars fill sequentially.
- Cart drawer & filters: spring slide-in; cart items slide out when removed; totals count up/down numerically.
- Counters (dashboard stats): count up on load.
- Skeletons: shimmer; images blur-up on load.
- Marquee: slow-scrolling ticker "Free delivery above Rs. X · Cash on Delivery · All Pakistan" when the free-delivery threshold is set.
- Number inputs/quantity stepper: digit slide animation.
- Admin: only fast fades (150 ms), row insert/remove transitions, status badge color transition, toast slide.

Performance guard: limit simultaneous running animations; disable parallax and heavy effects on screens < 768px or if `navigator.hardwareConcurrency <= 4`.

## 8. Responsive Behavior
- Design at 360px first. Tap targets ≥ 44px. No horizontal page scroll (tables/carousels scroll inside their own container).
- Header collapses to logo + icons; categories in a full-height drawer.
- Sticky bottom bars (product page Add to cart, checkout Place order) on mobile.
- Images use responsive sizes; hero image art-directed (portrait crop on mobile).
- Admin: sidebar → bottom navigation + drawer; tables → cards.

## 9. Accessibility
- Contrast ≥ 4.5:1 for text; never rely on color alone (badges have text/icons).
- Visible keyboard focus everywhere (2px red ring, offset 2px); skip-to-content link.
- Semantic HTML (`header`, `nav`, `main`, `footer`, headings in order), ARIA for drawer/modal/tabs/accordion/toasts (`aria-live="polite"`).
- All images have meaningful `alt` (product images: product name + color); decorative crosshair/lines `aria-hidden`.
- Forms: labels bound to inputs, error messages linked with `aria-describedby`.
- Respect `prefers-reduced-motion`; no auto-playing audio/video; carousels pausable.
- Urdu: proper `lang="ur"` and `dir="rtl"` on the document when selected.

## 10. Copy & Microcopy Direction
Short, plain, helpful; English and Urdu (Urdu in Urdu script; Roman Urdu is used only inside AI chat when the visitor writes that way).
- Buttons say what happens: "Add to cart", "Place order", "Upload screenshot", "Track order", "Save changes".
- Errors: say what went wrong and how to fix it ("Enter a mobile number like 0305 1234567"). No apologies, no jargon.
- Empty states invite action ("Your cart is empty — see new arrivals").
- Keep the same word for the same action everywhere (Order, not Purchase).
- Sample hero headline ideas: "Dressed for the day that matters." / "Tailored for Pakistan."

## 11. Image & Icon Direction
(Real image list, sizes and AI prompts will be produced later in the Images workflow; this is only direction.)
- **Real photos:** the store's actual clothing; consistent background (plain light-grey or black), natural soft light, same crop ratio per type. Product images 4:5 portrait (1200×1500 px). Hero images 3:4 portrait for mobile / 16:9 for desktop.
- **AI-generated (only for banners/backgrounds/illustrations):** dark, cinematic, minimal, black backdrop with a single red accent; no text inside images; no fake brand logos.
- **Logo:** use the provided logo; also needs a transparent-background PNG and a square mark (crosshair "A") for favicon/loader.
- **Icons:** one consistent line-icon set (lucide), 1.5px stroke, in white/black/red only. Any custom icons (category icons) must share this style.
- **Image slots to reserve in the UI:** hero slides (3), category tiles (11), occasion tiles (4), about page (2), banner backgrounds (2), logo/favicon, empty-state illustrations (cart, wishlist, orders), 404, payment-method icons (COD, JazzCash, Easypaisa, Bank).
- Before real images exist, use neutral **charcoal placeholder blocks with the crosshair mark** — not random stock photos.
