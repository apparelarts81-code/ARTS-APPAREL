# ARTS APPAREL — Cloudflare Workers Migration Brief for Google AI Studio Gemini

**Purpose:** Use this brief to migrate the existing ARTS-APPAREL repository from an Express + Google Gemini backend to a single Cloudflare Worker using Cloudflare Workers AI, while preserving the React/Vite storefront, Supabase integration, existing AI endpoint contracts, checkout, and admin interface.

**Source scope:** This document captures and organizes all information present in the Cloudflare chatbot response supplied by the project owner. That response refers to a separate file named `/ARTS-APPAREL-Cloudflare-Migration-Plan.md` (reported as 73 KB, with complete code), but that full file was **not** included in the supplied text. Consequently, this brief contains the complete supplied summary, not the referenced D1–D25 code listings or the full 25-item acceptance checklist. Do not pretend those missing contents have been reviewed.

---

## 1. Instructions to Gemini

Work in the existing **ARTS-APPAREL** GitHub repository. Inspect the real repository before making changes. Implement the migration in a careful, production-oriented way, preferably in a dedicated branch if supported by the workflow.

### Required end state

- Use a **single Cloudflare Worker** with `@cloudflare/vite-plugin` and Workers Static Assets.
- Serve the React/Vite single-page application and handle all seven existing `/api/ai/*` endpoints from the Worker `fetch` handler.
- Call Cloudflare Workers AI through the native `env.AI` binding. The proposed primary model is `@cf/zai-org/glm-4.7-flash`; the proposed fallback is `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- Preserve existing frontend components, routes, styling, Supabase client-side integration, checkout, admin UI, and the existing request/response contracts of `src/services/aiService.ts` wherever possible.
- Replace the Express server implementation in `server.ts` with Worker-compatible routing and handlers.
- Remove Google Gemini SDK usage (`@google/genai`) and the `GEMINI_API_KEY` dependency after confirming there are no remaining legitimate uses.
- Keep the Supabase service-role key server-side only. Never put it in frontend code, `VITE_*` variables, a committed file, or client-visible responses.
- Test, document, and explain each change. Do not claim a build, test, deployment, endpoint, or Cloudflare setting succeeded unless it was actually run and verified.

### Important implementation discipline

1. First inspect `package.json`, `vite.config.ts`, `tsconfig.json`, `.env.example`, `.gitignore`, `server.ts`, `src/services/aiService.ts`, `src/lib/supabase.ts`, `src/lib/rateLimit.ts`, and every existing AI route/authorization/quota implementation.
2. Treat the actual repository contracts as authoritative over assumptions in this brief. Preserve the existing payload and response shapes. If an actual contract differs from the plan, adapt the Worker implementation to the real contract and document the discrepancy rather than silently breaking the frontend.
3. Check the exact return shape of Supabase RPC `consume_ai_quota`, including whether field names use snake_case or camelCase. Enforce quota fail-closed: if quota enforcement fails, deny the request.
4. Ensure staff/owner endpoints verify the Supabase bearer token and fetch the role from trusted Supabase data. Never trust role values supplied by the browser.
5. Restrict CORS to the deployed site origin in production; do not leave `Access-Control-Allow-Origin: *` by default for authenticated endpoints.
6. Validate request methods, body size, required fields, and input types. Return consistent JSON errors and sensible HTTP status codes.
7. Keep working UI functionality and unrelated application features intact. Do not perform broad refactors unrelated to this migration.
8. When any proposed Cloudflare API, configuration field, model availability, plan allowance, or deployment instruction is uncertain, verify against current official Cloudflare documentation before relying on it.
9. Finish by listing files changed, commands actually run, test results, unresolved blockers, required Cloudflare dashboard configuration, and the Git commit/branch or push status (if Git access is enabled).

---

## 2. Recommended Architecture

**Cloudflare Worker with `@cloudflare/vite-plugin` + Static Assets:** one Worker serves the React/Vite SPA using Workers Static Assets and handles all seven `/api/ai/*` endpoints through its `fetch` handler, using a native Workers AI binding (`env.AI`).

The supplied Cloudflare answer gave these reasons for preferring Workers over Pages + Pages Functions:

- The existing Vite build is described as a drop-in, with `@cloudflare/vite-plugin` auto-detecting `index.html` and generating output Wrangler configuration with `assets.directory`.
- Workers AI binding is first-class on Workers, accessible through `env.AI.run()` and configured in `wrangler.jsonc`.
- Workers Builds provides GitHub CI/CD and automatic deployment on push.
- SPA routing is configured with `assets.not_found_handling = "single-page-application"`; no `_redirects` or `_routes.json` is required for this plan.
- The response states that Cloudflare's strategic direction is Workers rather than Pages and that Pages Git integration is being de-emphasized. **Re-check the current official documentation before relying on this strategic-direction claim.**

### Keep

- All React components, pages, routes, styling, and public assets.
- Supabase client-side code.
- Checkout and admin UI.
- Existing `/api/ai/*` endpoint paths and the established request/response shapes in `src/services/aiService.ts`.

### Replace or remove

- Replace `server.ts` (Express, Vite middleware, Node HTTP server) with the Worker backend.
- Remove `@google/genai` if no longer used elsewhere.
- Remove `GEMINI_API_KEY` once migration is complete.

---

## 3. Documentation References Supplied by Cloudflare's Answer

The supplied answer stated these claims were grounded in current official documentation as of October 2026. Preserve the references and independently re-check them before implementation:

- [Vite plugin overview](https://developers.cloudflare.com/workers/vite-plugin/)
- [React + Vite guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Vite plugin SPA tutorial](https://developers.cloudflare.com/workers/vite-plugin/tutorial/)
- [Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Workers AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/)
- [`env.AI.run()` / Worker binding methods](https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/)
- [Workers AI JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/)
- [GLM-4.7-Flash model](https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/)
- [Workers AI pricing and free allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Workers AI error codes](https://developers.cloudflare.com/workers-ai/platform/errors/)
- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [`secrets` configuration property changelog](https://developers.cloudflare.com/changelog/post/2026-03-24-secrets-config-property/)
- [Migrate from Pages to Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)

---

## 4. Proposed File Tree

Implement or adapt this structure only after comparing it with the repository's real files and project conventions.

```text
ARTS-APPAREL/
├── wrangler.jsonc                 [NEW] AI binding, SPA assets, runtime vars
├── vite.config.ts                 [MODIFIED] add Cloudflare Vite plugin
├── package.json                   [MODIFIED] add Cloudflare dependencies; remove @google/genai
├── tsconfig.json                  [MODIFIED] include worker/ and Cloudflare types
├── .env.example                   [MODIFIED] remove GEMINI_API_KEY and document required values
├── .gitignore                     [MODIFIED] add .wrangler and .dev.vars* exclusions
├── server.ts                      [REMOVED/REPLACED] Express server
├── worker/                        [NEW] Worker backend
│   ├── index.ts                   fetch handler: /api/ai/* to API router, other requests to ASSETS
│   ├── env.ts                     Env interface
│   ├── router.ts                  URL-to-handler dispatch
│   ├── auth.ts                    verify Supabase JWT and profiles.role using server-side credentials
│   ├── quota.ts                   consume_ai_quota RPC; fail closed
│   ├── rate-limit.ts              IP-based rate limit using CF-Connecting-IP
│   ├── ai/
│   │   ├── client.ts              env.AI.run wrapper, JSON mode, fallback, errors
│   │   ├── prompts.ts             system prompts for English, Urdu, and Roman Urdu
│   │   ├── schemas.ts             JSON schemas for search/describe/SEO/review summary
│   │   ├── chat.ts                POST /api/ai/chat (public)
│   │   ├── search.ts              POST /api/ai/search (public)
│   │   ├── size-explain.ts        POST /api/ai/size-explain (public)
│   │   ├── describe.ts            POST /api/ai/describe (staff/owner)
│   │   ├── translate.ts           POST /api/ai/translate (staff/owner)
│   │   ├── seo.ts                 POST /api/ai/seo (staff/owner)
│   │   └── review-summary.ts      POST /api/ai/review-summary (staff/owner)
│   └── utils/
│       ├── cors.ts                CORS headers and origin validation
│       ├── validate.ts            request validation and payload-size limits
│       └── response.ts            JSON response/error helpers
├── src/                           [PRESERVE FRONTEND]
│   ├── services/aiService.ts      keep current /api/ai/* fetch calls and contracts
│   ├── lib/supabase.ts            preserve frontend Supabase client configuration
│   └── lib/rateLimit.ts           [REVIEW/MODIFY] remove or refactor server-only limiter as appropriate
└── public/                        [PRESERVE ASSETS]
```

The supplied answer explicitly said not to add these in this Workers approach:

- `functions/` directory (Pages-only in the proposed design).
- `_routes.json` (Pages-only in the proposed design).
- `_redirects` (SPA routing is intended to be handled by Wrangler static assets configuration).
- `Dockerfile` (this plan does not use Cloudflare Containers).

---

## 5. Proposed Workers AI Model

The Cloudflare answer proposed using `@cf/zai-org/glm-4.7-flash` for all seven AI endpoints and `@cf/meta/llama-3.3-70b-instruct-fp8-fast` as a fallback.

| Property | Value stated in the supplied answer |
|---|---|
| Primary model ID | `@cf/zai-org/glm-4.7-flash` |
| Free plan | Stated as available on Free plan; answer says a July 2026 changelog lists it as Free-plan-accessible |
| Languages | Stated as supporting 100+ languages including Urdu |
| Context window | 131,072 tokens |
| JSON mode | Supported via `response_format` |
| Function calling | Supported |
| Pricing | $0.0605 per million input tokens and $0.40 per million output tokens, as stated in the answer |
| Fallback model | `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, also stated as available on Free plan |

**Gemini must verify** model identifiers, availability on the actual Cloudflare account/plan, JSON mode support, fallback availability, pricing, and any per-model limits against current official docs. Treat the listed values as sourced claims from the supplied chatbot response, not as live-tested facts.

### Per-endpoint generation settings proposed by the answer

| Endpoint | Access | JSON mode | Temperature | Max tokens |
|---|---|---:|---:|---:|
| `POST /api/ai/chat` | Public | No; free text | 0.8 | 512 |
| `POST /api/ai/search` | Public | Yes, `searchSchema` | 0.1 | 512 |
| `POST /api/ai/size-explain` | Public | No; free text | 0.5 | 256 |
| `POST /api/ai/describe` | Staff/owner | Yes, `describeSchema` | 0.7 | 512 |
| `POST /api/ai/translate` | Staff/owner | No; free text | 0.3 | 1024 |
| `POST /api/ai/seo` | Staff/owner | Yes, `seoSchema` | 0.4 | 512 |
| `POST /api/ai/review-summary` | Staff/owner | Yes, `reviewSummarySchema` | 0.3 | 512 |

Use the actual endpoint contracts and current Workers AI API schema when implementing these parameters. Do not rename expected output properties or alter request/response shapes without a compatibility layer.

---

## 6. AI Client Error Handling

The supplied plan calls for these behaviors in `worker/ai/client.ts`:

- **Workers AI error 3040 (out of capacity):** retry using the fallback model.
- **Workers AI error 3036 (daily quota exhausted):** return HTTP `429` with a clear message.
- **Malformed JSON:** strip Markdown code fences and retry parsing; if the result is still invalid, return HTTP `502`.
- **Timeout or unknown error:** return HTTP `502`; never fabricate success or invent a generated result.

Verify current error codes and the exact returned error shapes against official Cloudflare docs and actual runtime responses. Avoid retry loops; limit retries and make fallback behavior observable in safe server logs without exposing secrets or customer data.

---

## 7. Authentication and Authorization

For staff/owner endpoints (`describe`, `translate`, `seo`, and `review-summary`), the supplied plan specifies this flow:

1. Read a bearer token from the `Authorization` header.
2. Verify the token by calling Supabase `/auth/v1/user`.
3. Query `/rest/v1/profiles?id=eq.<userId>&select=role` using the **server-side service-role key**, because the request needs trusted role data even when ordinary RLS would prevent the query.
4. Allow the operation only if the trusted role is `staff` or `owner`; reject unauthenticated users and all other roles.
5. Never trust a role sent by the client.

Implementation requirements:

- Store `SUPABASE_SERVICE_ROLE_KEY` as a Worker secret, never in source control or the browser.
- Never return the service-role key in responses, logs, build output, or error strings.
- Return suitable `401` or `403` responses for missing/invalid authentication or insufficient role.
- Check the actual profile table schema and role labels in the repository's Supabase project.
- Do not bypass authentication for staff/owner endpoints during production operation.

---

## 8. Quota and Rate Limiting

The proposed `worker/quota.ts` calls Supabase RPC `consume_ai_quota(p_scope, p_units)` using a server-side credential.

Requirements specified in the answer:

- **Fail closed:** if the RPC call fails or the response cannot be interpreted safely, deny the request rather than permitting unlimited AI usage.
- Return/interpret `{ allowed, remaining, retry_after_seconds }`.
- The in-memory IP rate limiter based on `CF-Connecting-IP` is per-isolate, so it is not a globally authoritative limit.
- The Supabase quota RPC is intended to be the authoritative global quota.
- Consider Cloudflare KV if global IP-based rate limiting is later required.

**Unresolved item:** the precise JSON field names/shape returned by the actual `consume_ai_quota` RPC must be inspected before writing the implementation. The supplied answer explicitly called out the possibility of snake_case versus camelCase names. Do not guess the response contract.

---

## 9. Review Summary Safety

For `POST /api/ai/review-summary`:

- If the supplied `reviews` array is empty, immediately return the appropriate response, such as `{ "has_reviews": false }`, without calling the AI model. Match the existing frontend contract when determining the exact response body.
- The system prompt must instruct the model not to fabricate sentiment, opinions, or review content.
- Only actual review text provided to the handler may be summarized.
- Do not manufacture a summary for an empty review set.
- Validate input size and type; avoid logging personal or sensitive review data unnecessarily.

---

## 10. Environment Variables, Bindings, and Secrets

The supplied Cloudflare answer gave this table:

| Name | Intended type/location in the answer | Visibility noted in the answer |
|---|---|---|
| `AI` | Workers AI binding in `wrangler.jsonc` under `ai.binding` | Native binding; no API key |
| `ASSETS` | Static Assets binding, auto-provisioned | Native binding |
| `SUPABASE_URL` | Runtime variable in `wrangler.jsonc` under `vars` | Public URL |
| `VITE_SUPABASE_URL` | Build-time variable in Workers Builds | Public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Listed as a secret via dashboard or `wrangler secret put` | The answer calls it browser-safe, creating a configuration inconsistency that Gemini must resolve |
| `VITE_DEMO_MODE` | Variable in `wrangler.jsonc` under `vars` according to the answer | Public/configuration value |
| `VITE_SITE_URL` | Variable in `wrangler.jsonc` under `vars` according to the answer | Public/configuration value |
| `VITE_GOOGLE_AUTH_ENABLED` | Variable in `wrangler.jsonc` under `vars` according to the answer | Public/configuration value |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret in dashboard or set via `wrangler secret put` | **Private; server-only** |

### Important environment-variable clarification

The supplied answer is internally inconsistent about `VITE_SUPABASE_PUBLISHABLE_KEY`: it labels the key a “Secret,” but also says it is browser-safe and lists it as a build variable, then lists it again among runtime secrets. In Vite, `VITE_*` values used in browser code are compiled into the client bundle and are not confidential. Gemini must inspect how `src/lib/supabase.ts` uses this key and configure it consistently as a **public/build-time publishable key**, not as a private credential. It must never confuse this publishable key with `SUPABASE_SERVICE_ROLE_KEY`.

The answer says no API key is required for Workers AI because the native `AI` binding authenticates through the Cloudflare account. Confirm the final binding configuration in the current Workers documentation.

Remove `GEMINI_API_KEY` and `@google/genai` when no live code path depends on them.

### Required secret hygiene

- `SUPABASE_SERVICE_ROLE_KEY`: Worker runtime secret only; never `VITE_`-prefixed.
- Never commit `.dev.vars`, `.dev.vars.*`, `.env` containing real secrets, or generated secret values.
- Ensure `.gitignore` excludes `.wrangler` and `.dev.vars*` as proposed.
- `.env.example` should contain placeholder names and safe example values only.

---

## 11. Wrangler / Worker Configuration Requirements

Create `wrangler.jsonc` in line with the current Cloudflare Vite plugin and Workers Static Assets documentation. The supplied plan calls for:

- Workers AI binding named `AI`.
- Static Assets binding named `ASSETS`.
- SPA not-found handling: `assets.not_found_handling = "single-page-application"`.
- Route API requests through the Worker using `run_worker_first: ["/api/*"]` so `/api/ai/*` hits the `fetch` handler, while other requests can be served from static assets.
- Runtime variables such as `SUPABASE_URL`, `VITE_DEMO_MODE`, `VITE_SITE_URL`, and `VITE_GOOGLE_AUTH_ENABLED` as appropriate to the real app and build process.
- Secret values supplied securely through Cloudflare dashboard or `wrangler secret put`, not hard-coded into committed configuration.

**Do not copy an unverified configuration blindly.** Check the actual configuration schema and the Vite plugin-generated output. Avoid declaring the same binding or variable in conflicting ways. Confirm that the deployed SPA receives only the public values needed at build time and that the Worker reads server-only secrets at runtime.

---

## 12. GitHub-to-Cloudflare Deployment Plan

The supplied answer proposes this dashboard workflow:

1. Open the Cloudflare [Import repository page](https://dash.cloudflare.com/83bac9ccc3aea8b7724eb020e546576c/workers-and-pages/create/import-repository).
2. Authorize the Cloudflare GitHub app and select `ARTS-APPAREL`.
3. Set the production branch to `main`.
4. Set build command to `npm run build` and deploy command to `npx wrangler deploy`, if that matches the current Workers Builds workflow for this Vite plugin setup.
5. Set the build variables needed by the frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DEMO_MODE`, `VITE_SITE_URL`, and `VITE_GOOGLE_AUTH_ENABLED`.
6. After the first deploy, configure runtime secret `SUPABASE_SERVICE_ROLE_KEY` in **Settings → Variables & Secrets**. The answer also lists `VITE_SUPABASE_PUBLISHABLE_KEY` as a runtime secret; resolve the inconsistency described in Section 10 and do not treat browser-exposed publishable values as confidential.
7. Verify the Workers AI binding in the [Workers AI dashboard](https://dash.cloudflare.com/83bac9ccc3aea8b7724eb020e546576c/ai/workers-ai).
8. Keep non-secret Worker configuration in `wrangler.jsonc` and set secrets through dashboard/CLI.
9. The answer says non-`main` branches generate preview URLs; verify this behavior and the configured branch/build settings in the current dashboard.
10. Verify SPA routes work through `not_found_handling = "single-page-application"`.
11. Verify `/api/ai/*` requests reach the Worker via `run_worker_first: ["/api/*"]`, using same-origin calls without changing the frontend API base URL.
12. Verify auto-deploy by pushing a commit and checking the Builds tab for the new build and deployment result.

The supplied answer included direct Cloudflare dashboard links that may include account-specific path identifiers. If a link does not open, navigate through the Cloudflare dashboard manually rather than assuming permissions or account context.

---

## 13. Endpoint Inventory and Compatibility

The plan states all seven endpoint paths remain unchanged:

| Endpoint | Intended access | Core compatibility requirement |
|---|---|---|
| `POST /api/ai/chat` | Public | Preserve chat messages/language inputs and existing reply format |
| `POST /api/ai/search` | Public | Preserve natural-language search input and filter response schema |
| `POST /api/ai/size-explain` | Public | Preserve height, weight, fit, and recommended-size inputs and output contract |
| `POST /api/ai/describe` | Staff/owner | Preserve product-description generation fields for English/Urdu |
| `POST /api/ai/translate` | Staff/owner | Preserve translation input/output contract |
| `POST /api/ai/seo` | Staff/owner | Preserve SEO title, description, and tags contract |
| `POST /api/ai/review-summary` | Staff/owner | Summarize genuine customer reviews; do not fabricate when there are no reviews |

The supplied answer did not include the exact request/response TypeScript shapes for these endpoints. Inspect `src/services/aiService.ts` and the existing server route implementations to recover the real contract before implementing. Keep endpoint names and payload shapes compatible unless an unavoidable change is approved and reflected in the frontend.

---

## 14. Tests and Acceptance Criteria

The Cloudflare answer states that it verified via documentation research: Workers AI binding API, GLM-4.7-Flash Free-plan availability, JSON Mode support, Workers Builds workflow, Static Assets SPA routing, a Free-plan allowance of 10,000 Neurons per day resetting at 00:00 UTC, and error codes 3036/3040. Those are **documentation research claims, not evidence that this particular application has been built or deployed successfully**. Re-verify current limits and behavior.

The answer mentions a **25-item acceptance checklist** in the absent full plan file but does not include the checklist items. Therefore, the original 25-item checklist cannot be reproduced from the supplied summary. At minimum, implement and report tests covering the categories below; distinguish these from the absent original checklist.

### Minimum test categories

- Install dependencies using the repository's documented package manager and confirm a clean production build.
- Run TypeScript/lint checks configured by the repository.
- Confirm direct navigation/refresh works for SPA routes and static assets are served correctly.
- Call each of the seven endpoints and verify its actual response contract.
- Test English, Urdu, and Roman Urdu content where the endpoint supports it.
- Verify that unauthenticated users cannot call staff/owner endpoints.
- Verify that customer/non-staff roles are rejected and staff/owner roles are checked from trusted Supabase profile data.
- Verify quota success, exhausted quota, malformed quota RPC response, and quota RPC outage; all quota uncertainty must fail closed.
- Verify empty review arrays do not invoke AI and return the expected no-reviews response.
- Verify malformed model JSON, model capacity errors, quota errors, timeouts, and unknown AI errors return safe, consistent responses.
- Verify CORS allows the production storefront origin and rejects unapproved browser origins as configured.
- Verify request methods, body sizes, and payload types are validated.
- Search built assets and committed files for accidental exposure of service-role credentials or other secrets.
- Verify Cloudflare AI binding and Worker secrets are configured without committing secret values.
- Push a test commit and verify the GitHub-connected Cloudflare deployment succeeds.
- Test production behavior on the deployed Cloudflare URL, not only locally.

### Free-plan usage statement from the answer

- Workers AI free allocation stated as **10,000 Neurons per day**, resetting at **00:00 UTC**.
- The answer estimates capacity at approximately **50–200 AI requests/day**, depending on token usage.
- It recommends monitoring the [Workers AI usage dashboard](https://dash.cloudflare.com/83bac9ccc3aea8b7724eb020e546576c/ai/workers-ai/usage).

Treat the 50–200 request estimate as an estimate, not a guaranteed cap. Confirm the account's current quota, model-specific pricing, and actual consumption in Cloudflare dashboard telemetry.

---

## 15. Limitations and Unresolved Questions from the Supplied Answer

These limitations were explicitly identified in the response and must remain visible until resolved:

1. **Repository inspection limitation:** The chatbot said the repository is private and that it could not inspect actual `aiService.ts`, `server.ts`, `rateLimit.ts`, or `package.json`. Its code was based on described contracts. Gemini must inspect the real repository and confirm actual request/response shapes before implementing.
2. **Free-plan capacity:** The answer estimated around 50–200 AI requests/day depending on token use. Monitor usage and treat this as an approximate estimate only.
3. **In-memory rate limiting:** It is per Worker isolate. The Supabase database quota RPC is intended to be the authoritative global limit; KV was suggested as a possible future option for globally coordinated IP rate limiting.
4. **Express incompatibility:** The existing `server.ts` reportedly uses `express()`, `app.listen()`, Vite middleware, and Node.js HTTP APIs. The plan says this is replaced by a Worker `fetch` handler. Gemini must verify the real file and use compatible Worker APIs rather than assuming every Node API is available.
5. **Actual endpoint contracts:** The precise `aiService.ts` inputs/outputs are unresolved in the supplied answer.
6. **Quota return values:** The actual `consume_ai_quota` RPC JSON keys and nesting are unresolved; snake_case versus camelCase was specifically called out.
7. **CORS:** The answer says CORS is currently `*` and recommends restricting it to the production domain.
8. **Publishable key configuration:** The answer inconsistently labels `VITE_SUPABASE_PUBLISHABLE_KEY` a secret while also calling it browser-safe. Resolve this using the actual frontend usage and Vite build-time behavior; never expose the service-role key.
9. **Missing source plan:** The 73 KB `/ARTS-APPAREL-Cloudflare-Migration-Plan.md`, sections D1–D25, and its detailed 25-item checklist are referenced but not included in the material Gemini is being given here.

---

## 16. Required Deliverables from Gemini

When implementation is finished, provide:

1. All modified/new files in the repository, with no omitted required source files.
2. A concise explanation of the Worker architecture and request routing.
3. An environment-variable table separating build-time public values, runtime public values, and private Worker secrets.
4. The exact Cloudflare dashboard steps required for deployment.
5. Commands executed and truthful results for build, typecheck/lint, and tests.
6. Endpoint-by-endpoint compatibility/test report for all seven AI APIs.
7. Security review confirming service-role key is never client-exposed, staff/owner auth is server-verified, CORS is appropriately limited, and quota fails closed.
8. A list of any untested features or unresolved blockers.
9. A Git commit/branch/push summary only if Git actions were actually performed successfully.

Do not say “deployed,” “tested,” “verified,” or “complete” when you have only written code or reviewed documentation. Separate implemented, locally tested, deployed, and manually verified statuses.

---

## 17. Short Implementation Directive

> Migrate ARTS APPAREL from Express + Google Gemini to a single Cloudflare Worker using `@cloudflare/vite-plugin` and Workers Static Assets. Replace `server.ts` with a Worker `fetch` entry point and compatible modules under `worker/`. Route the same seven `/api/ai/*` endpoints through the Worker and preserve the request/response contracts found in the real repository. Replace `@google/genai` calls with the native Workers AI `env.AI.run()` API, using `@cf/zai-org/glm-4.7-flash` as the proposed primary model and `@cf/meta/llama-3.3-70b-instruct-fp8-fast` as the proposed fallback only after confirming current availability and API compatibility. Keep the frontend, Supabase client, checkout, admin UI, routes, and styling intact. Add the required Cloudflare Vite plugin and Wrangler configuration, including the AI binding, Static Assets SPA routing, and Worker-first handling for `/api/*`. Protect staff/owner endpoints with Supabase bearer-token verification and a trusted role lookup. Store `SUPABASE_SERVICE_ROLE_KEY` as a Worker secret. Enforce database AI quota fail-closed, validate inputs, handle AI errors without fabricating success, preserve no-review summary safety, restrict production CORS, remove the Gemini SDK/key when unused, and test all seven endpoints and deployment. Inspect the actual source repository first; do not assume the missing D1–D25 code file or invent its contents. Resolve all noted discrepancies and report truthfully what was implemented and tested.

---

## 18. Original Response's Closing Question

The supplied Cloudflare answer closed by asking whether to export the plan as a cloneable repository with all code files pre-structured or adjust architectural decisions first. This brief selects the recommended architecture as the working direction, but Gemini should **inspect the repository and verify current Cloudflare documentation before applying changes**. No complete cloneable repository or D1–D25 code was included in the supplied attachment.
