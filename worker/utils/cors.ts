import { Env } from '../env';

/**
 * Validates request origin against allowed origins and returns appropriate CORS headers.
 * In production:
 * - Never returns wildcard '*' for authenticated requests.
 * - Restricts to the configured site origin or known application domains.
 * In development / preview:
 * - Allows localhost and preview deployment origins.
 */
export function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigin = resolveAllowedOrigin(origin, env);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

function resolveAllowedOrigin(origin: string | null, env: Env): string | null {
  if (!origin) return null;

  const siteUrl = env.VITE_SITE_URL || 'https://artsapparel.pk';
  const isProd = env.ENVIRONMENT === 'production' || process?.env?.NODE_ENV === 'production';

  // Normalize configured site origin
  let configuredOrigin = '';
  try {
    configuredOrigin = new URL(siteUrl).origin;
  } catch {
    configuredOrigin = siteUrl;
  }

  // Exact match to configured production origin
  if (origin === configuredOrigin) {
    return origin;
  }

  // Allow same-origin or localhost in non-production / development
  if (!isProd) {
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('.workers.dev') ||
      origin.includes('googleusercontent.com') ||
      origin.includes('aistudio')
    ) {
      return origin;
    }
  }

  // Allow production Cloudflare pages / workers domain for artsapparel if configured
  if (origin === 'https://artsapparel.pk' || origin === 'https://www.artsapparel.pk') {
    return origin;
  }

  return null;
}

/**
 * Handles CORS Preflight OPTIONS request.
 */
export function handleCorsPreflight(request: Request, env: Env): Response {
  const headers = getCorsHeaders(request, env);
  return new Response(null, {
    status: 204,
    headers,
  });
}
