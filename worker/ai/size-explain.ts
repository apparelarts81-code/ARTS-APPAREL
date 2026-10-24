import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { parseJsonBody } from '../utils/validate';
import { getClientIp } from '../rate-limit';
import { enforceAiQuota } from '../quota';
import { runAi } from './client';
import { getSizeExplainPrompt } from './prompts';

export async function handleAiSizeExplain(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const parsed = await parseJsonBody(request, corsHeaders);
  if (parsed.errorResponse) return parsed.errorResponse;

  const { height_cm, weight_kg, fit, recommended_size } = parsed.data || {};
  const height = Number(height_cm);
  const weight = Number(weight_kg);

  if (isNaN(height) || height < 100 || height > 250 || isNaN(weight) || weight < 30 || weight > 200) {
    return errorResponse('Valid height (100-250 cm) and weight (30-200 kg) are required.', 400, {}, corsHeaders);
  }

  const cleanFit = String(fit || 'Regular').slice(0, 20);
  const cleanSize = String(recommended_size || 'M').slice(0, 10);

  const clientIp = getClientIp(request);
  const quota = await enforceAiQuota(`anon:${clientIp}`, false, env);
  if (!quota.allowed) {
    return jsonResponse({ error: 'Size explanation rate limit exceeded.' }, 429, corsHeaders);
  }

  if (!env.AI) {
    return jsonResponse({
      text: `Size ${cleanSize} is selected according to Pakistani tailoring standards for ${height} cm and ${weight} kg with a ${cleanFit} fit.`,
    }, 200, corsHeaders);
  }

  const prompt = getSizeExplainPrompt(height, weight, cleanFit, cleanSize);

  try {
    const result = await runAi(env, {
      prompt,
      temperature: 0.5,
      max_tokens: 256,
    });

    return jsonResponse({ text: result.text }, 200, corsHeaders);
  } catch {
    return jsonResponse({
      text: `Size ${cleanSize} matches your entered height and weight profile according to our store size chart.`,
    }, 200, corsHeaders);
  }
}
