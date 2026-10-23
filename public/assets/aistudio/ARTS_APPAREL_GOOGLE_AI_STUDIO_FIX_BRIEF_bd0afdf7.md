# ARTS-APPAREL — Google AI Studio Major Fix Brief

## Project
- GitHub repository: https://github.com/apparelarts81-code/ARTS-APPAREL
- Goal: repair the existing application in-place while preserving its current design, pages, business intent, and documentation.
- This is a code-repair task, not a request to rebuild the app from scratch.

## Important execution rules
1. Inspect the entire repository and all project documentation before editing. Treat the PRD, TRD, App Flow, UI/UX Brief, Backend Schema, and Implementation Plan as the primary project requirements.
2. First provide a concise implementation plan based on the actual files. Then implement the high-priority changes below.
3. Do not access, modify, migrate, reset, seed, or otherwise change any live Supabase project or database. Database setup will be handled separately after these code changes have been reviewed.
4. Do not invent database tables, columns, RLS policies, SQL RPCs, environment variable names, or API contracts. Reuse documented contracts only. For any missing database-dependent contract, make the application fail safely and document the exact missing contract in `FOLLOW_UP_REQUIRED.md`.
5. Do not place secrets or API keys in source code, commit them, or print them into logs. Use environment variables and update `.env.example` with placeholders only.
6. Preserve the existing branding, responsive layouts, Urdu/RTL support, localization, and working user flows unless a documented bug requires a change. Avoid unrelated redesigns and broad dependency upgrades.
7. Do not hide failures behind demo data or `localStorage`. Do not report a write, order, login, upload, or setting change as successful unless the real operation succeeded.
8. Keep demo behavior available only when an explicit, clearly named demo-mode environment flag is enabled. Production/default mode must not silently use demo accounts or local fake persistence.
9. Do not delete tests or loosen assertions just to make checks pass. Do not disable lint/type checks. Avoid changing lockfiles unless a dependency change genuinely requires it.
10. Do not make a production deployment, merge a branch, or apply any database change. Keep the changes reviewable and provide a complete file-by-file summary.

## Critical findings to address
The existing audit identified the following risky areas. Re-open each file and verify the behavior before changing it; repository state may have changed since the audit.

### P0 — Order placement and stock correctness
Relevant file: `src/services/orderService.ts`; checkout UI: `src/pages/CheckoutPage.tsx`.
- Current flow may persist an order and decrement stock in local state before the Supabase order RPC completes.
- If the Supabase RPC fails, the app may fall back to a locally fabricated order number/total and still appear successful.
- Remove the production fallback that makes checkout appear successful when the authoritative operation failed.
- Make the service return a typed success/error result (or use the existing project error convention) so the UI can show a useful failure message and keep the user on checkout when saving fails.
- Do not decrement client-side stock separately when stock is supposed to be changed atomically by the server/database operation.
- Never trust client-calculated prices, discount amounts, shipping, tax, stock, or final totals as authoritative. Send only the necessary product/variant/quantity/coupon/address/payment metadata and let the documented backend contract validate and calculate values.
- Do not assume a `place_order` RPC exists unless it is declared in the project's backend schema/documentation. If its signature or required schema is unavailable, document the missing contract; do not fabricate it.
- Ensure loading state prevents duplicate submissions and that failed submissions do not clear the cart or display an order-success screen.

### P0 — Authentication and authorization boundaries
Relevant files: `src/services/authService.ts`, `src/context/AuthContext.tsx`, `src/lib/supabase.ts`, `src/routes.tsx`, and relevant admin pages.
- Audit localStorage session restoration and any seeded demo accounts. LocalStorage must not be treated as proof of identity or as authoritative role data in production.
- Use the existing Supabase Auth client as the source of truth when Supabase mode is configured. Restore sessions using supported Supabase Auth APIs and subscribe/unsubscribe to auth-state changes without leaking listeners.
- Admin route guards are UI convenience only. Never treat client-side route guards, hidden buttons, localStorage roles, or values supplied by a browser as database security.
- Never allow the client to elevate its own role. Do not implement role changes as a local-only change presented as persisted authorization.
- Do not invent a `set_user_role` RPC or database schema. If owner-authorized staff changes need a missing backend contract, make the UI report that the operation is not configured and record the required contract in `FOLLOW_UP_REQUIRED.md`.
- Ensure sign-out clears the real Supabase session and relevant local UI cache. Avoid deleting unrelated browser storage.
- Keep demo/test accounts usable only when an explicit demo mode is enabled; clearly label them as demo-only.

### P1 — Make Supabase errors and empty data distinguishable
Relevant files include `src/services/catalogService.ts`, `src/services/orderService.ts`, `src/services/settingsService.ts`, `src/services/couponService.ts`, `src/services/profileService.ts`, and `src/services/storageService.ts`.
- Distinguish a successful query returning zero rows from a query that failed due to connectivity, permission, missing table, missing function, or another server error.
- In production mode, do not use fake catalog/orders/settings/coupons as an implicit fallback after an error or empty response.
- Keep demo data behind an explicit demo-mode flag only.
- Check every Supabase write result. If a write fails, return/throw a useful typed error and show an error state; do not show a success toast or update the UI as if it were persisted.
- Avoid writing to localStorage before the real write is confirmed unless the code explicitly implements a documented optimistic UI that rolls back on failure.
- Keep errors useful for users but do not expose sensitive database internals or secrets in end-user messages.

### P1 — Settings and coupons must not fake persistence
Relevant files: `src/services/settingsService.ts`, `src/services/couponService.ts`, and `src/pages/admin/AdminCouponsPage.tsx`.
- Verify create/update/delete operations inspect the actual Supabase response and handle errors.
- Admin pages must show success only after the backend write succeeds.
- If a required table or RPC has not been configured, show an actionable configuration error rather than silently storing local data.
- Do not add or alter the live database schema in this task.

### P1 — Payment proof upload must use a persistent location
Relevant files: `src/pages/CheckoutPage.tsx`, `src/services/storageService.ts`, and any payment-proof service/model.
- A browser `blob:` preview URL is temporary and must never be saved as the permanent payment proof URL/path.
- Separate local preview state from the persistent Storage object path/URL.
- Use the existing upload service/contract if one is documented. Verify file type and sensible size limits, handle upload failure, and only submit the order/payment metadata after a persistent upload succeeds when proof is required.
- Do not assume a Storage bucket exists or create one remotely. Record the required bucket name, access policy, and schema contract in `FOLLOW_UP_REQUIRED.md` if not documented.

### P1 — Staff management must not simulate authorization changes
Relevant file: `src/pages/admin/AdminStaffPage.tsx`.
- Current UI may keep staff records in localStorage without changing authoritative role assignments.
- Clearly separate staff directory/profile data from authorization roles.
- Remove any claim that a role change was saved unless a documented, authorized backend operation succeeds.
- Do not expose service-role secrets to the browser. Do not invent a role-management RPC. Document missing owner authorization and server-side checks in `FOLLOW_UP_REQUIRED.md`.

### P1 — AI endpoints and real-data behavior
Relevant files include `server.ts`, `src/services/aiService.ts`, and AI-related UI/pages.
- Review the documented target hosting/runtime before changing the server architecture. The current Express server and any Cloudflare Pages configuration may not be wired together; do not assume a static redirect file deploys an Express server.
- Do not do a large deployment-platform migration in this pass. Identify the mismatch, correct only what can be safely corrected within the current repository, and document deployment/runtime decisions that require owner approval.
- AI server endpoints must not trust a client-supplied role or user ID. Where authentication is supported by the documented architecture, verify the actual token server-side and authorize staff/admin actions server-side.
- Do not expose provider API keys to browser code. Keep AI provider credentials on the server.
- Avoid hardcoded catalog, delivery, refund, or store policy claims when the app has no verified source for them. Prefer live data/context from documented server-side sources; otherwise explicitly state that the information is unavailable.
- A review summary must not invent positive sentiment or imply reviews exist when none are available. For zero/insufficient reviews, return an honest message such as “Not enough reviews to summarize.”
- Do not invent an AI quota RPC such as `consume_ai_quota`. If the docs require quota enforcement but its schema/runtime is missing, document the exact requirement for the follow-up database/backend phase.

### P2 — Routes, environment, scripts, and tests
Relevant files include `src/routes.tsx`, `package.json`, `.env.example`, `vite.config.ts`, `server.ts`, and existing tests.
- Inspect account routes. If `/account/orders` and `/account/addresses` currently reuse the same generic page, implement only behavior supported by the current UI/UX specification; otherwise document the unfinished route instead of pretending it is complete.
- Align the actual code with the project documentation where practical, but do not blindly downgrade React/React Router or upgrade dependencies just because versions differ. Explain any compatibility trade-off in the summary.
- Preserve the primary package manager/lockfile convention unless there is clear evidence the project intentionally uses another one. Do not regenerate both lockfiles without reason.
- Ensure the build/type-check/lint commands are accurately documented. Add a separate typecheck script only if it fits the existing toolchain without disrupting scripts.
- Run the available tests and checks. Report the exact commands and results. If a command cannot run because dependencies, environment variables, database access, or browser tooling are unavailable, say so; never claim it passed.
- Do not add unrelated decorative assets or rewrite the README merely to satisfy a checklist unless the documentation explicitly requires it and it helps the current task.

## Implementation process
1. Inspect the repository, existing docs, and current git diff before editing.
2. List the files you intend to change and the reason for each.
3. Implement small, coherent changes rather than replacing entire files unnecessarily.
4. Keep the app able to start in the supported development mode. When a real backend contract is missing, fail safely with a clear message instead of simulating production success.
5. Add/update focused unit tests for order failure paths, service error handling, authentication state transitions, and payment-proof URL/path handling wherever the existing test setup supports them.
6. Run formatting/lint, typecheck, tests, and production build using the scripts actually present in `package.json`.
7. Review the final diff for secrets, debug output, unrelated formatting changes, disabled tests, and accidental database/deployment operations.
8. Do not commit or merge unless the environment explicitly requires a commit and the user has authorized it. Do not deploy.

## Required deliverables from Google AI Studio
Return all of the following:

1. **Changed code files** — actual modifications, not just code snippets, where repository editing is supported.
2. **`AI_STUDIO_CHANGE_REPORT.md`** — include:
   - What changed and why, grouped by priority.
   - File-by-file summary.
   - Any intentional behavior changes.
   - Commands run and their real output/status.
   - Known remaining issues.
   - Confirmation that no live Supabase database or deployment was modified.
3. **`FOLLOW_UP_REQUIRED.md`** — exact missing requirements for the next database/backend setup phase. For each, list the calling file/service, expected operation, data/parameters required, security/authorization expectations, and evidence from existing docs/code. Clearly mark unknowns instead of guessing.
4. **No secrets in deliverables** — all environment values must be placeholders.

## Acceptance checklist
- [ ] Production checkout cannot report success if the authoritative order operation fails.
- [ ] Client code does not independently adjust authoritative stock before a successful backend operation.
- [ ] Supabase auth/session—not localStorage—is the identity source when production/Supabase mode is active.
- [ ] Client-side roles are not treated as security enforcement and the browser cannot promote itself.
- [ ] Supabase query failures and empty results are handled differently.
- [ ] Production mode does not silently fall back to fake/local data.
- [ ] Settings/coupons/admin writes report success only when persisted successfully.
- [ ] Payment proof stores a durable Storage path/URL, never a blob preview URL.
- [ ] AI routes do not trust client-supplied authorization or expose API secrets.
- [ ] Tests/checks are reported truthfully; missing environment/configuration is not presented as a passing result.
- [ ] No live Supabase changes, deployment, or merge occurred.

## Suggested opening prompt
“Read this file together with all project documentation and the existing repository. First inspect and report the exact implementation plan and files affected. Then implement the fixes in this brief while respecting every execution rule. Do not create or modify the live Supabase database. Do not invent missing schema/RPC contracts. When blocked by a missing backend/database contract, fail safely and document it in `FOLLOW_UP_REQUIRED.md`. Finish with the required reports, the real test/build results, and a clean explanation of anything you could not safely complete.”
