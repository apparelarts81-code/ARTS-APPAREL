import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { parseJsonBody } from '../utils/validate';
import { AuthContext } from '../auth';
import { enforceAiQuota } from '../quota';
import { runAi } from './client';
import { getDescribePrompt } from './prompts';
import { describeSchema } from './schemas';

export async function handleAiDescribe(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  auth: AuthContext
): Promise<Response> {
  const parsed = await parseJsonBody(request, corsHeaders);
  if (parsed.errorResponse) return parsed.errorResponse;

  const { name, category, fabric, points } = parsed.data || {};
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return errorResponse('Product name is required (max 100 chars).', 400, {}, corsHeaders);
  }

  const cleanCategory = String(category || '').slice(0, 50);
  const cleanFabric = String(fabric || 'fine fabric').slice(0, 100);
  const cleanPoints = Array.isArray(points)
    ? points.slice(0, 10).map((p: any) => String(p).slice(0, 100))
    : [];

  const quota = await enforceAiQuota(`staff:${auth.userId}`, true, env);
  if (!quota.allowed) {
    return jsonResponse({ error: 'Staff AI rate limit exceeded. Please wait a moment.' }, 429, corsHeaders);
  }

  if (!env.AI) {
    return jsonResponse({
      description_en: `Premium ${name} tailored from ${cleanFabric}.`,
      description_ur: `اعلیٰ درجے کے ${cleanFabric} سے تیار کردہ ${name}۔`,
    }, 200, corsHeaders);
  }

  const prompt = getDescribePrompt(name, cleanCategory, cleanFabric, cleanPoints);

  try {
    const result = await runAi(env, {
      prompt,
      temperature: 0.7,
      max_tokens: 512,
      jsonMode: true,
      schema: describeSchema,
    });

    const parsedJson = result.parsedJson || {};
    return jsonResponse({
      description_en: parsedJson.description_en || `Master tailored ${name} crafted from ${cleanFabric}.`,
      description_ur: parsedJson.description_ur || `بہترین سلائی اور نفاست سے آراستہ ${name}۔`,
    }, 200, corsHeaders);
  } catch (err: any) {
    console.error('Workers AI Describe Error (Safe Log):', err?.message || 'Unknown error');
    return jsonResponse({
      description_en: `Master tailored ${name} crafted from ${cleanFabric}.`,
      description_ur: `بہترین سلائی اور نفاست سے آراستہ ${name}۔`,
    }, 200, corsHeaders);
  }
}
