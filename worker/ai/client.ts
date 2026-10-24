import { Env } from '../env';

export const PRIMARY_MODEL = '@cf/zai-org/glm-4.7-flash';
export const FALLBACK_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export interface AiRunOptions {
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  prompt?: string;
  temperature?: number;
  max_tokens?: number;
  jsonMode?: boolean;
  schema?: Record<string, any>;
}

export interface AiRunResult {
  text: string;
  parsedJson?: any;
  modelUsed: string;
  isFallback: boolean;
}

export class AiClientError extends Error {
  statusCode: number;
  code?: string | number;

  constructor(message: string, statusCode: number = 502, code?: string | number) {
    super(message);
    this.name = 'AiClientError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Strips markdown code fences (```json ... ```) and parses JSON.
 */
export function cleanAndParseJson(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from AI model');
  }

  let cleaned = rawText.trim();

  // Strip Markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Attempt standard JSON parse
  return JSON.parse(cleaned);
}

/**
 * Executes a Workers AI generation request using env.AI binding.
 * Tries PRIMARY_MODEL first; falls back to FALLBACK_MODEL on capacity (3040) or transient failure.
 * Handles Cloudflare error 3036 (quota exhausted) with 429.
 */
export async function runAi(
  env: Env,
  options: AiRunOptions
): Promise<AiRunResult> {
  if (!env.AI) {
    throw new AiClientError(
      'Cloudflare Workers AI binding (env.AI) is not configured in this environment.',
      503,
      'AI_BINDING_MISSING'
    );
  }

  const promptText = options.prompt || '';
  const messages = options.messages || (promptText ? [{ role: 'user', content: promptText }] : []);

  const inputPayload: Record<string, any> = {
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 512,
  };

  if (options.jsonMode) {
    inputPayload.response_format = { type: 'json_object' };
  }

  // Attempt 1: Try Primary Model
  try {
    const primaryResult = await env.AI.run(PRIMARY_MODEL, inputPayload);
    return processModelResponse(primaryResult, PRIMARY_MODEL, false, options.jsonMode);
  } catch (err: any) {
    const errorCode = err?.code || err?.status;
    const errorMsg = String(err?.message || '');

    // Error 3036: Daily quota exhausted
    if (errorCode === 3036 || errorMsg.includes('3036') || errorMsg.toLowerCase().includes('quota')) {
      throw new AiClientError(
        'Workers AI daily token quota exhausted. Please try again tomorrow.',
        429,
        3036
      );
    }

    // If error 3040 (out of capacity) or model unavailable, try Fallback Model
    console.warn(`Primary model ${PRIMARY_MODEL} failed, attempting fallback ${FALLBACK_MODEL}:`, errorMsg);

    try {
      const fallbackResult = await env.AI.run(FALLBACK_MODEL, inputPayload);
      return processModelResponse(fallbackResult, FALLBACK_MODEL, true, options.jsonMode);
    } catch (fallbackErr: any) {
      const fbCode = fallbackErr?.code || fallbackErr?.status;
      if (fbCode === 3036 || String(fallbackErr?.message).includes('3036')) {
        throw new AiClientError(
          'Workers AI daily token quota exhausted. Please try again tomorrow.',
          429,
          3036
        );
      }
      throw new AiClientError(
        'Cloudflare Workers AI model capacity unavailable.',
        502,
        fbCode || 3040
      );
    }
  }
}

function processModelResponse(
  raw: any,
  modelUsed: string,
  isFallback: boolean,
  jsonMode?: boolean
): AiRunResult {
  const text = typeof raw === 'string'
    ? raw
    : (raw?.response ?? raw?.text ?? JSON.stringify(raw ?? ''));

  if (!jsonMode) {
    return {
      text: text.trim(),
      modelUsed,
      isFallback,
    };
  }

  try {
    const parsedJson = cleanAndParseJson(text);
    return {
      text,
      parsedJson,
      modelUsed,
      isFallback,
    };
  } catch {
    throw new AiClientError(
      'Malformed JSON returned by AI model.',
      502,
      'MALFORMED_JSON'
    );
  }
}
