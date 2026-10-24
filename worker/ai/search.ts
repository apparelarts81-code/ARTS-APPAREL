import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { parseJsonBody } from '../utils/validate';
import { getClientIp } from '../rate-limit';
import { enforceAiQuota } from '../quota';
import { runAi, AiClientError } from './client';
import { getSearchPrompt } from './prompts';
import { searchSchema } from './schemas';

export async function handleAiSearch(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const parsed = await parseJsonBody(request, corsHeaders);
  if (parsed.errorResponse) return parsed.errorResponse;

  const { query } = parsed.data || {};
  if (typeof query !== 'string' || query.trim().length === 0) {
    return errorResponse('Search query is required.', 400, {}, corsHeaders);
  }
  if (query.length > 200) {
    return errorResponse('Search query exceeds 200 characters.', 400, {}, corsHeaders);
  }

  const clientIp = getClientIp(request);
  const quota = await enforceAiQuota(`anon:${clientIp}`, false, env);
  if (!quota.allowed) {
    return jsonResponse({ quotaExceeded: true, error: 'Search rate limit exceeded.' }, 429, corsHeaders);
  }

  if (!env.AI) {
    return jsonResponse({ filters: {}, unavailable: true }, 200, corsHeaders);
  }

  const prompt = getSearchPrompt(query);

  try {
    const result = await runAi(env, {
      prompt,
      temperature: 0.1,
      max_tokens: 512,
      jsonMode: true,
      schema: searchSchema,
    });

    return jsonResponse({ filters: result.parsedJson || {} }, 200, corsHeaders);
  } catch (err: any) {
    console.error('Workers AI Search Error (Safe Log):', err?.message || 'Unknown error');
    if (err instanceof AiClientError && err.statusCode === 429) {
      return jsonResponse({ quotaExceeded: true, filters: {}, unavailable: true }, 429, corsHeaders);
    }
    return jsonResponse({ filters: {}, unavailable: true }, 200, corsHeaders);
  }
}
