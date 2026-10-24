import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { parseJsonBody } from '../utils/validate';
import { AuthContext } from '../auth';
import { enforceAiQuota } from '../quota';
import { runAi } from './client';
import { getTranslatePrompt } from './prompts';

export async function handleAiTranslate(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  auth: AuthContext
): Promise<Response> {
  const parsed = await parseJsonBody(request, corsHeaders);
  if (parsed.errorResponse) return parsed.errorResponse;

  const { text, from, to } = parsed.data || {};
  if (typeof text !== 'string' || text.trim().length === 0 || text.length > 1000) {
    return errorResponse('Text to translate is required (max 1000 chars).', 400, {}, corsHeaders);
  }

  const cleanFrom = String(from || 'en').slice(0, 10);
  const cleanTo = String(to || 'ur').slice(0, 10);

  const quota = await enforceAiQuota(`staff:${auth.userId}`, true, env);
  if (!quota.allowed) {
    return jsonResponse({ error: 'Staff AI rate limit exceeded.' }, 429, corsHeaders);
  }

  if (!env.AI) {
    return jsonResponse({ text }, 200, corsHeaders);
  }

  const prompt = getTranslatePrompt(text, cleanFrom, cleanTo);

  try {
    const result = await runAi(env, {
      prompt,
      temperature: 0.3,
      max_tokens: 1024,
    });

    return jsonResponse({ text: result.text.trim() }, 200, corsHeaders);
  } catch {
    return jsonResponse({ text }, 200, corsHeaders);
  }
}
