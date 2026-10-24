/**
 * Cloudflare Worker Environment Interface
 * Declares typed native bindings, runtime variables, and server-only secrets.
 */
export interface Env {
  /** Native Workers AI binding configured via wrangler.jsonc */
  AI?: {
    run: (model: string, inputs: Record<string, any>, options?: Record<string, any>) => Promise<any>;
  };

  /** Workers Static Assets binding */
  ASSETS?: {
    fetch: (request: Request | string) => Promise<Response>;
  };

  /** Supabase Project REST / Auth Base URL (Runtime variable) */
  SUPABASE_URL?: string;

  /**
   * Supabase Service-Role Secret Key (Worker runtime secret only)
   * CRITICAL: Never expose to frontend, never prefix with VITE_, never return in responses or logs.
   */
  SUPABASE_SERVICE_ROLE_KEY?: string;

  /** Frontend publishable variables (build-time / runtime fallback) */
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SITE_URL?: string;
  VITE_DEMO_MODE?: string;
  VITE_GOOGLE_AUTH_ENABLED?: string;

  /** Worker environment identifier (production, preview, development) */
  ENVIRONMENT?: string;
}
