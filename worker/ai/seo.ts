import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { parseJsonBody } from '../utils/validate';
import { AuthContext } from '../auth';
import { enforceAiQuota } from '../quota';
import { runAi } from './client';
import { getSeoPrompt } from './prompts';
import { seoSchema } from './schemas';

export async function handleAiSeo(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  auth: AuthContext
): Promise<Response> {
  const parsed = await parseJsonBody(request, corsHeaders);
  if (parsed.errorResponse) return parsed.errorResponse;

  const { name, category, description } = parsed.data || {};
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return errorResponse('Product name is required (max 100 chars).', 400, {}, corsHeaders);
  }

  const cleanCategory = String(category || '').slice(0, 50);
  const cleanDescription = String(description || '').slice(0, 500);

  const quota = await enforceAiQuota(`staff:${auth.userId}`, true, env);
  if (!quota.allowed) {
    return jsonResponse({ error: 'Staff AI rate limit exceeded.' }, 429, corsHeaders);
  }

  if (!env.AI) {
    return jsonResponse({
      seo_title: `${name} | ARTS APPAREL Pakistan`,
      seo_description: cleanDescription.slice(0, 150) || `Buy ${name} at ARTS APPAREL.`,
      tags: [name.toLowerCase(), cleanCategory.toLowerCase()].filter(Boolean),
    }, 200, corsHeaders);
  }

  const prompt = getSeoPrompt(name, cleanCategory, cleanDescription);

  try {
    const result = await runAi(env, {
      prompt,
      temperature: 0.4,
      max_tokens: 512,
      jsonMode: true,
      schema: seoSchema,
    });

    const parsedJson = result.parsedJson || {};
    return jsonResponse({
      seo_title: parsedJson.seo_title || `${name} | ARTS APPAREL Pakistan`,
      seo_description: parsedJson.seo_description || cleanDescription.slice(0, 150),
      tags: Array.isArray(parsedJson.tags) ? parsedJson.tags : ['menswear', 'clothing', 'pakistan'],
    }, 200, corsHeaders);
  } catch {
    return jsonResponse({
      seo_title: `${name} | ARTS APPAREL Pakistan`,
      seo_description: cleanDescription.slice(0, 150) || '',
      tags: ['menswear', 'clothing', 'pakistan'],
    }, 200, corsHeaders);
  }
}
