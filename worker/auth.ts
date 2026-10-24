import { Env } from './env';
import { errorResponse } from './utils/response';

export interface AuthContext {
  userId: string;
  role: 'staff' | 'owner';
}

export interface AuthResult {
  auth?: AuthContext;
  errorResponse?: Response;
}

/**
 * Verifies Supabase Bearer JWT and checks that the user's role in the `profiles` table
 * is either 'staff' or 'owner'. Uses server-side service-role credentials to read
 * trusted role data and never trusts client-supplied roles.
 */
export async function requireStaffOrOwner(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string> = {}
): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const isProd = env.ENVIRONMENT === 'production' || process?.env?.NODE_ENV === 'production';
    if (!isProd && !env.SUPABASE_SERVICE_ROLE_KEY) {
      // Local development simulation fallback when running without cloud Supabase secrets
      return {
        auth: {
          userId: 'dev-staff-local',
          role: 'staff',
        },
      };
    }
    return {
      errorResponse: errorResponse(
        'Unauthorized: Missing or invalid authorization token.',
        401,
        {},
        corsHeaders
      ),
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      errorResponse: errorResponse(
        'Unauthorized: Token cannot be empty.',
        401,
        {},
        corsHeaders
      ),
    };
  }

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    const isProd = env.ENVIRONMENT === 'production' || process?.env?.NODE_ENV === 'production';
    if (!isProd) {
      return {
        auth: {
          userId: 'dev-staff-local',
          role: 'staff',
        },
      };
    }
    return {
      errorResponse: errorResponse(
        'Service Unavailable: Supabase service URL is not configured.',
        503,
        {},
        corsHeaders
      ),
    };
  }

  try {
    const baseUrl = supabaseUrl.replace(/\/+$/, '');

    // Step 1: Validate token with Supabase Auth endpoint
    // We send the user's bearer token to /auth/v1/user
    const userRes = await fetch(`${baseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceKey || env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      },
    });

    if (!userRes.ok) {
      return {
        errorResponse: errorResponse(
          'Unauthorized: Invalid or expired authentication session.',
          401,
          {},
          corsHeaders
        ),
      };
    }

    const userData = await userRes.json();
    const userId = userData?.id;
    if (!userId || typeof userId !== 'string') {
      return {
        errorResponse: errorResponse(
          'Unauthorized: Unable to verify user identity.',
          401,
          {},
          corsHeaders
        ),
      };
    }

    // Step 2: Fetch user profile role from Supabase database using service-role key
    if (serviceKey) {
      const profileRes = await fetch(
        `${baseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`,
        {
          method: 'GET',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!profileRes.ok) {
        return {
          errorResponse: errorResponse(
            'Authentication verification service error.',
            500,
            {},
            corsHeaders
          ),
        };
      }

      const profiles = await profileRes.json();
      const profile = Array.isArray(profiles) ? profiles[0] : profiles;
      const role = profile?.role;

      if (role !== 'staff' && role !== 'owner') {
        return {
          errorResponse: errorResponse(
            'Forbidden: Staff or Owner role required to access this resource.',
            403,
            {},
            corsHeaders
          ),
        };
      }

      return {
        auth: {
          userId,
          role,
        },
      };
    }

    // If service role key is not configured in local development
    const isProd = env.ENVIRONMENT === 'production' || process?.env?.NODE_ENV === 'production';
    if (!isProd) {
      return {
        auth: {
          userId,
          role: 'staff',
        },
      };
    }

    return {
      errorResponse: errorResponse(
        'Service Unavailable: Server authorization credentials are not configured.',
        503,
        {},
        corsHeaders
      ),
    };
  } catch {
    return {
      errorResponse: errorResponse(
        'Authentication verification service error.',
        500,
        {},
        corsHeaders
      ),
    };
  }
}
