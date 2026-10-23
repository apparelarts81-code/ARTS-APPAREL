# ARTS APPAREL — Google AI Studio Follow-up Fix Brief (v2)

**Repository:** https://github.com/apparelarts81-code/ARTS-APPAREL  
**Target branch:** `main` (preferably work in a new branch and provide a reviewable diff/commit)  
**Scope:** Code corrections and automated tests only. This is a follow-up to `AI_STUDIO_CHANGE_REPORT.md` and `FOLLOW_UP_REQUIRED.md`.

## Mission

Inspect the current repository code, fix the concrete issues listed below, add regression tests, and produce an evidence-based change report. Do not assume the previous change report is proof that the implementation works: verify the actual source and run the commands available in the repository. Do not merely change comments or documentation to claim a fix; implement and test the behavior.

## Strict boundaries

1. **Do not connect to, modify, migrate, seed, reset, or otherwise change the live Supabase project in this pass.** No live database work is authorized by this brief. The next phase will handle the existing Supabase project separately.
2. Do not create a new Supabase project. Do not add SQL migrations/schema files in this code-only pass. Keep `FOLLOW_UP_REQUIRED.md` as the list of backend contracts still requiring implementation and later verification; update it only if code-contract details need correction.
3. Never put real API keys, `service_role` keys, access tokens, passwords, production user information, or other secrets into source control, reports, screenshots, or logs. Environment files must contain placeholders only.
4. Do not weaken database authorization to make a frontend action work. RLS and database functions must remain the actual security boundary. Frontend route guards are UX only.
5. Avoid unrelated redesigns, dependency upgrades, or broad refactors. Preserve the current store design and existing app requirements.
6. Do not report a test/build/browser check as passed unless you actually ran it and captured its real result. Separate automated checks from checks that could not be run.
7. Avoid committing Google AI Studio temporary media artifacts under `.aistudio/artifacts/**/.tempmediaStorage/` unless an image is an intentional product asset required by the app.

---

## P0 — Make production fail closed when Supabase is not configured

**File:** `src/lib/supabase.ts`  
**Current issue:** `isDemoMode` becomes `true` when Supabase credentials are missing and `VITE_DEMO_MODE` is unset. A production deployment with missing/misspelled environment variables can silently show demo users/data and store actions in localStorage instead of using the backend.

### Required change

- Make demo mode opt-in explicitly: it must be enabled only with `VITE_DEMO_MODE="true"`, and it must never turn itself on merely because Supabase credentials are missing.
- Permit any convenient default demo behavior only in an unmistakable local development environment, using a safe development-only check; never infer “development” solely from missing keys.
- When running in production with missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY`, show a clear configuration error/empty state and prevent all demo authentication, demo order placement, demo staff role switching, and localStorage-backed business mutations.
- Keep a clearly documented, intentional demo setup for development/tests.
- Do not treat a configured Supabase URL plus an invalid/empty publishable key as a usable backend.

### Tests required

- Production + missing credentials + no demo toggle => demo mode is false and the app reports configuration failure.
- `VITE_DEMO_MODE=true` in the supported demo/test environment => demo mode operates.
- Configured Supabase + `VITE_DEMO_MODE=true` must not accidentally switch a production build away from the real backend unless the project explicitly documents and tests that behavior.

---

## P0 — Align `place_order` RPC response contract with checkout

**Files:** `src/services/orderService.ts`, `src/pages/CheckoutPage.tsx`, `FOLLOW_UP_REQUIRED.md`, relevant tests.  
**Current issue:** `FOLLOW_UP_REQUIRED.md` declares `place_order(...) RETURNS TABLE (order_id uuid, order_number text, total numeric)`, while `orderService.placeOrder()` reads `data.order_id`, `data.order_number`, and `data.total` as if `data` were a single object. Supabase JS normally represents a table-returning RPC response as an array of rows. This mismatch can make a valid database order look like a failed checkout after the order was already committed.

### Required change

- Establish one unambiguous contract between the SQL specification and TypeScript service. Prefer preserving the currently documented `RETURNS TABLE` contract and normalize the response safely (e.g. validate that it is an array with exactly one valid result row). If choosing a JSON-object return shape instead, update every call site and the backend contract documentation consistently and explain why.
- Validate `order_id`, `order_number`, and numeric `total` before returning success. An empty array, multiple unexpected rows, missing IDs, or invalid totals must be a controlled error with diagnostics that do not reveal secrets.
- Do not retry placement automatically after a successful RPC or treat an unknown response as permission to create a second order. The order may already exist.
- Keep the current rule that production orders are never silently saved as demo/local orders and that production stock is not decremented from the browser.
- Review how post-order proof upload failure is reported. Do not tell the customer the entire order failed after the backend order was confirmed; make the “order placed, receipt needs follow-up” state explicit so the customer is not pushed to place a duplicate order.

### Tests required

- Successful RPC returning `[ { order_id, order_number, total } ]` produces the expected `PlaceOrderResult`.
- Malformed/empty RPC data fails clearly without localStorage fallback.
- RPC errors remain errors and never create a local production order.
- Proof-upload failure after confirmed order creation is represented as a post-order warning and does not trigger another order call.

---

## P0 — Remove unsafe direct-table fallbacks after security-sensitive RPC failures

**Files:** `src/services/reviewService.ts`, `src/services/returnService.ts` (and inspect other security-sensitive RPC call sites).  
**Current issue:** `submitReview()` tries `submit_review` but falls back to inserting directly into `reviews`; `requestReturn()` tries `request_return` but falls back to inserting directly into `return_requests`. If the RPC contains business rules (eligible delivered order, one review per buyer/product, valid ownership/return window), direct table writes may bypass those rules unless every rule is independently and correctly enforced by RLS/constraints.

### Required change

- In production mode, if `submit_review` is missing, fails, or returns an invalid result, return a clear error. Do not use a direct-table insert fallback.
- In production mode, if `request_return` is missing, fails, or returns an invalid result, return a clear error. Do not use a direct-table insert fallback.
- Use the signed-in Supabase identity (`auth.uid()`) as the identity authority. Do not trust a caller-supplied `user_id` to decide who is submitting a review/return.
- Do not convert authorization, eligibility, or missing-RPC errors into a success result. User interfaces should show an actionable, non-sensitive error.
- Audit other RPC-first code for the same issue, including coupon validation, delivery charge calculation, order cancellation, and payment proof recording. For each fallback, decide whether it truly preserves server-side validation. Do not remove benign read-only fallback behavior unless needed; never bypass security-sensitive writes.

### Tests required

- If `submit_review` rejects or is unavailable, no table insert is attempted and the operation fails visibly.
- If `request_return` rejects or is unavailable, no table insert is attempted and the operation fails visibly.
- Guest/customer input cannot choose another user's identity in any production write path.

---

## P1 — Fix signup/session state when email confirmation is required

**Files:** `src/services/authService.ts`, `src/context/AuthContext.tsx`, relevant signup UI/tests.  
**Current issue:** `authService.signup()` reports a user as successful whenever `data.user` exists. Some Supabase Auth configurations require email confirmation and may return a user without an active session. `AuthContext.signup()` then immediately sets the user as logged in even though no authenticated session exists.

### Required change

- Treat the Supabase session—not the presence of a user object alone—as the proof of a logged-in state.
- If sign-up succeeds but `data.session` is null, return a distinct success/pending-confirmation result and show the user a message to confirm their email. Keep `AuthContext` unauthenticated until the real Supabase auth state change reports a session.
- Preserve customer-only default role behavior. Never allow user metadata or request payloads to grant the `staff` or `owner` role.
- Keep demo signup isolated to demo mode only.
- Avoid creating inconsistent context state between the signup return value and `onAuthStateChange`.

### Tests required

- Supabase signup returns `{ user, session: null }` => signup is pending confirmation; `AuthContext` is not authenticated.
- Signup returns an active session => session state is set from the authoritative session.
- User metadata containing a role such as `owner` does not grant elevated access.

---

## P1 — Stop AI features from inventing positive review summaries or stale product claims

**Files:** `server.ts`, `src/services/aiService.ts`, `src/services/reviewService.ts`.  
**Current issue:** When review-summary generation fails or the Gemini key is missing, `server.ts` / `aiService.ts` can return generic positive claims such as “buyers praise the craftsmanship” even though no such conclusion has been generated from the supplied reviews. The public AI chat/search fallback can also show hard-coded demo products/prices when an API request fails, including in a production configuration.

### Required change

- For zero reviews, retain the honest “not enough reviews” response.
- For AI errors, missing configuration, malformed JSON, or non-2xx API responses, do not return invented positive sentiment. Return an explicit neutral failure/unavailable state, or provide a deterministic summary strictly derived from the actual supplied review ratings/text and label it as a simple summary rather than AI-generated.
- Validate and cap request body sizes, message lengths, number of messages, review count, review comment length, and other user-controlled text before sending it to Gemini.
- Do not expose raw internal exception messages or secrets to public clients. Log only safe diagnostic details server-side.
- On public AI endpoints (`/api/ai/chat`, `/api/ai/search`, `/api/ai/size-explain`), avoid fabricated real-time product availability/prices. If API calls fail in production, use a clearly defined unavailable response or only query real catalog data; reserve hard-coded demo catalog suggestions for explicit demo mode.
- Keep staff/owner-only routes protected by `requireStaffOrOwner`. Test both missing/invalid token and valid/invalid role behavior. Do not trust a role sent in the request body.

### Tests required

- Empty review list => no sentiment claim.
- Gemini error or invalid JSON => no generic positive review summary.
- Production AI endpoint error => no hard-coded demo prices/stock claim.
- Oversized/malformed request is rejected safely.
- Public customer cannot call staff/owner-only endpoints successfully without an authorized Supabase session and role.

---

## P1 — Add real AI API quota/rate-limit enforcement in code, without provisioning the database yet

**Files:** `server.ts`, `FOLLOW_UP_REQUIRED.md`, tests as applicable.  
**Current issue:** `consume_ai_quota` is described in the pending backend specification, but no implementation or server-side usage was found in the current repository. All public AI endpoints can trigger Gemini requests without an evident rate limit.

### Required change in this pass

- Add a clear server-side quota integration contract and call site for the future `consume_ai_quota` backend capability, if it can be done without weakening security or assuming the function already exists.
- Because the database has not yet been provisioned, handle a missing quota RPC safely: in production, fail closed for paid AI requests or use a conservative process-local fallback rate limit with a documented warning that it is not distributed/persistent. Do not claim the database quota is active until verified later.
- Separate quota scopes for public/anonymous and authenticated staff/owner AI actions as appropriate. Do not accept arbitrary trusted user IDs/scope keys from the request body; derive scope from verified identity or a safe server-side anonymous key strategy.
- Ensure quota checks are applied before all Gemini calls, including chat, search, size explanation, descriptions, translation, SEO, and review summary.
- Do not add `SUPABASE_SERVICE_ROLE_KEY` to browser code or send it to the frontend.

### Tests required

- Repeated calls exceed the configured fallback limit and are rejected with HTTP 429 or a documented safe error.
- A missing database quota function cannot silently allow unlimited requests in production.
- Tests clearly state that process-local limits do not replace database-backed quotas in multi-instance deployments.

---

## P2 — Small correctness and repository hygiene fixes

1. **Storage file names/content type:** `src/services/storageService.ts` converts images to WebP but keeps the original filename extension. Make the object path extension agree with the actual uploaded WebP content (`.webp`) or preserve original encoding consistently. Keep bucket MIME checks and size limits.
2. **Service query/mutation contracts:** inspect `settingsService`, `catalogService`, `couponService`, `deliveryService`, `bannerService`, and `orderService` for ignored Supabase errors, optimistic success, or error handling that turns a failed production write into success. Preserve the distinction between “no rows” and “query failed.”
3. **Test reliability:** `src/lib/serviceValidation.test.ts` currently tests the demo order flow, not the live RPC contract. Add focused unit tests for the new response normalization and failure handling, using mocks; do not require access to the live database in unit tests.
4. **Environment/deployment documentation:** keep `.env.example` placeholders only. State which deployment runtime is supported by the Express/Vite `server.ts`. Do not assert Cloudflare Pages/Workers compatibility unless the API server is actually deployed through a compatible adapter or separately hosted service.
5. **Temporary files:** do not add new AI Studio temp-media files to the repository. If appropriate, add a targeted `.gitignore` entry for future `.aistudio/artifacts/**/.tempmediaStorage/` outputs without deleting intentional assets.

---

## Verification workflow (must actually run)

Use the package manager/lockfile already selected by the repository; do not regenerate lockfiles or change dependencies unnecessarily.

1. Install dependencies in a reproducible way if the environment permits.
2. Run TypeScript check: `npm run lint` (currently configured as `tsc --noEmit`).
3. Run unit tests: `npx tsx --test src/lib/*.test.ts`.
4. Run production build: `npm run build`.
5. If possible, add/run tests using mocked Supabase clients for production failure cases. Do not run live writes against the real Supabase project.
6. Review `git diff` for accidental UI redesigns, credential exposure, temp files, or unrelated dependency changes.
7. Report the exact command and actual exit/result for each check. If a check cannot run, say why.

## Deliverables

1. A reviewable code diff/commit (prefer a separate branch; do not force-push or merge automatically).
2. Updated automated tests covering the required cases above.
3. `AI_STUDIO_FOLLOW_UP_CHANGE_REPORT.md` containing:
   - each issue fixed and exact files changed;
   - the chosen RPC return contract and how it is normalized;
   - commands actually run and their real results;
   - remaining limitations and any work deferred to Supabase provisioning;
   - explicit statement that the live Supabase database was not modified.
4. Keep `FOLLOW_UP_REQUIRED.md` accurate about backend schema/functions/buckets/RLS still pending. Do not mark them complete just because their names are documented.

## Acceptance criteria

- Production does not silently enter demo mode when Supabase configuration is missing.
- Successful `place_order` RPC response is parsed according to the documented contract; malformed responses cannot produce fake success or invite duplicate orders.
- Security-sensitive RPC failure never falls back to an unguarded direct-table write.
- Supabase signup without a session never makes the UI think the user is authenticated.
- AI fallback behavior does not invent positive customer sentiment or live catalog claims.
- AI endpoints have protective input validation and safe rate/quota behavior, with limitations honestly documented.
- TypeScript check, unit tests, and production build results are reported accurately.
- No live Supabase database changes are made in this pass.
