import { Env } from './env';
import { handleApiRequest } from './router';

/**
 * Cloudflare Worker Entry Point
 * Routes all `/api/*` requests to the Worker API router,
 * and passes all static asset & SPA page requests to Workers Static Assets (`env.ASSETS`).
 */
export default {
  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const url = new URL(request.url);

    // Route API requests through the Worker fetch handler
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }

    // Serve SPA static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
