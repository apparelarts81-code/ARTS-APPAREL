# ARTS APPAREL — Fix Cloudflare Workers Deployment Error 100324

## Objective
Fix the current Cloudflare Workers deployment failure in the GitHub repository `apparelarts81-code/ARTS-APPAREL`. Work on the existing project; do not redesign the site or switch it back to Cloudflare Pages.

## Evidence from the latest deployment log
The build and asset upload are succeeding:
- `npm clean-install` succeeds.
- `npm run build` succeeds.
- Wrangler reads the Vite-generated config at `dist/arts_apparel/wrangler.json`.
- The generated Worker has `env.AI` and `env.ASSETS` bindings.
- 67 static assets upload successfully.

Deployment fails only when Cloudflare validates redirects:

```text
Invalid _redirects configuration:
Line 1: Infinite loop detected in this rule. This would cause a redirect to strip `.html` or `/index` and end up triggering this rule again. [code: 100324]
```

## Root cause confirmed in the repository
The repository file `public/_redirects` currently contains exactly:

```text
/*  /index.html  200
```

That is a Pages-style catch-all rewrite to `/index.html`. The current app is a Cloudflare Worker with Static Assets, and `wrangler.jsonc` already has the SPA fallback configured:

```json
"assets": {
  "directory": "dist",
  "binding": "ASSETS",
  "not_found_handling": "single-page-application",
  "run_worker_first": ["/api/*"]
}
```

The SPA fallback already handles client-side navigation. The redundant catch-all `_redirects` rule is the trigger for Wrangler error `100324`.

## Required fix
1. Delete `public/_redirects` from GitHub. Do not replace it with another catch-all redirect or rewrite.
2. Search the repository for any other `_redirects` files or rules that rewrite `/*` to `/index.html`; remove any redundant copy that is included in the deployed static assets. The confirmed source is `public/_redirects`.
3. Keep `wrangler.jsonc`'s `assets.not_found_handling` set to `single-page-application` and keep `run_worker_first` for `/api/*`. Do not remove the Workers AI `AI` binding or the `ASSETS` binding.
4. Do not change dependency versions or lockfiles unless a separate validation error proves they need changes. The latest log shows dependency installation and build both pass.
5. Do not disable validation, suppress the error, or switch the project back to Pages as a workaround.

## Validate before pushing
Using the repository's configured package manager and the committed lockfile, run:

```bash
npm ci
npm run lint
npm run build
npx wrangler deploy --dry-run
```

If the repository environment requires `--legacy-peer-deps` via the existing `.npmrc`, retain that setting. If any command fails, diagnose and fix the actual failure; do not claim success without the command output.

Check the build output to ensure `dist/client/index.html` and the generated Wrangler configuration exist and confirm there is no `dist/client/_redirects` being copied from `public/_redirects` after that file is removed.

## Commit and deploy
- Commit the deletion and any minimal required fix to the existing `main` branch with a message such as `fix: remove conflicting SPA redirects for Workers`.
- Verify that the commit is pushed to GitHub.
- Let Cloudflare Workers Builds deploy from that commit using the existing build command `npm run build` and deploy command `npx wrangler deploy`.
- Inspect the new deployment log. It must get past redirect validation and finish deployment successfully.

## Post-deployment checks
1. Open the deployed `workers.dev` URL and confirm the homepage returns HTTP 200 and renders.
2. Open a client-side route such as `/shop` directly in a fresh tab; it should return the SPA shell rather than a Cloudflare 404.
3. Confirm `/api/ai/chat` is routed to the Worker (send a valid POST JSON payload for a functional test; a GET may correctly return 405).
4. Confirm `AI` and `ASSETS` bindings remain present in the successful deployment.

## Important deployment architecture note
The current repository is a Cloudflare Workers + Static Assets app, not a Pages-only deployment. Its `wrangler.jsonc`, `worker/index.ts`, and Vite Cloudflare plugin are designed for Workers. Do not change architecture in order to fix this redirect-loop error.

## Expected result
The only confirmed root cause in this log is `public/_redirects` containing `/* /index.html 200`. Removing this Pages-style catch-all allows Wrangler's configured SPA handling to manage frontend routes and should remove deployment error `100324`. Verify with an actual successful build/deploy; do not guarantee success until Cloudflare reports it.

## Official Cloudflare documentation
- Workers Static Assets and SPA fallback: https://developers.cloudflare.com/workers/static-assets/
- Workers Static Assets SPA routing: https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- Workers Static Assets redirects: https://developers.cloudflare.com/workers/static-assets/redirects/
