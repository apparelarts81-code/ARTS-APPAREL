import { Env } from './env';
import { getCorsHeaders, handleCorsPreflight } from './utils/cors';
import { errorResponse } from './utils/response';
import { requireStaffOrOwner } from './auth';

import { handleAiChat } from './ai/chat';
import { handleAiSearch } from './ai/search';
import { handleAiSizeExplain } from './ai/size-explain';
import { handleAiDescribe } from './ai/describe';
import { handleAiTranslate } from './ai/translate';
import { handleAiSeo } from './ai/seo';
import { handleAiReviewSummary } from './ai/review-summary';

export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    return handleCorsPreflight(request, env);
  }

  const corsHeaders = getCorsHeaders(request, env);

  // 1. POST /api/ai/chat (Public)
  if (pathname === '/api/ai/chat') {
    if (method !== 'POST') {
      return errorResponse('Method Not Allowed. Use POST.', 405, {}, corsHeaders);
    }
    return handleAiChat(request, env, corsHeaders);
  }

  // 2. POST /api/ai/search (Public)
  if (pathname === '/api/ai/search') {
    if (method !== 'POST') {
      return errorResponse('Method Not Allowed. Use POST.', 405, {}, corsHeaders);
    }
    return handleAiSearch(request, env, corsHeaders);
  }

  // 3. POST /api/ai/size-explain (Public)
  if (pathname === '/api/ai/size-explain') {
    if (method !== 'POST') {
      return errorResponse('Method Not Allowed. Use POST.', 405, {}, corsHeaders);
    }
    return handleAiSizeExplain(request, env, corsHeaders);
  }

  // 4. POST /api/ai/describe (Staff/Owner)
  if (pathname === '/api/ai/describe') {
    if (method !== 'POST') {
      return errorResponse('Method Not Allowed. Use POST.', 405, {}, corsHeaders);
    }
    const authResult = await requireStaffOrOwner(request, env, corsHeaders);
    if (authResult.errorResponse) return authResult.errorResponse;
    return handleAiDescribe(request, env, corsHeaders, authResult.auth!);
  }

  // 5. POST /api/ai/translate (Staff/Owner)
  if (pathname === '/api/ai/translate') {
    if (method !== 'POST') {
      return errorResponse('Method Not Allowed. Use POST.', 405, {}, corsHeaders);
    }
    const authResult = await requireStaffOrOwner(request, env, corsHeaders);
    if (authResult.errorResponse) return authResult.errorResponse;
    return handleAiTranslate(request, env, corsHeaders, authResult.auth!);
  }

  // 6. POST /api/ai/seo (Staff/Owner)
  if (pathname === '/api/ai/seo') {
    if (method !== 'POST') {
      return errorResponse('Method Not Allowed. Use POST.', 405, {}, corsHeaders);
    }
    const authResult = await requireStaffOrOwner(request, env, corsHeaders);
    if (authResult.errorResponse) return authResult.errorResponse;
    return handleAiSeo(request, env, corsHeaders, authResult.auth!);
  }

  // 7. POST /api/ai/review-summary (Staff/Owner)
  if (pathname === '/api/ai/review-summary') {
    if (method !== 'POST') {
      return errorResponse('Method Not Allowed. Use POST.', 405, {}, corsHeaders);
    }
    const authResult = await requireStaffOrOwner(request, env, corsHeaders);
    if (authResult.errorResponse) return authResult.errorResponse;
    return handleAiReviewSummary(request, env, corsHeaders, authResult.auth!);
  }

  // Unknown /api/* route
  return errorResponse(`API endpoint not found: ${pathname}`, 404, {}, corsHeaders);
}
