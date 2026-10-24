import { Env } from '../env';
import { jsonResponse, errorResponse } from '../utils/response';
import { parseJsonBody } from '../utils/validate';
import { getClientIp } from '../rate-limit';
import { enforceAiQuota } from '../quota';
import { runAi, AiClientError } from './client';
import { getChatPrompt } from './prompts';

export async function handleAiChat(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const parsed = await parseJsonBody(request, corsHeaders);
  if (parsed.errorResponse) return parsed.errorResponse;

  const { messages, language } = parsed.data || {};

  // Input validation
  if (!Array.isArray(messages) || messages.length === 0) {
    return errorResponse('Invalid request: messages array is required.', 400, {}, corsHeaders);
  }
  if (messages.length > 10) {
    return errorResponse('Conversation history exceeds maximum of 10 messages.', 400, {}, corsHeaders);
  }
  for (const msg of messages) {
    if (!msg || typeof msg.content !== 'string' || msg.content.length > 500) {
      return errorResponse('Message content exceeds maximum allowed length of 500 characters.', 400, {}, corsHeaders);
    }
  }

  // Quota & Rate limit check
  const clientIp = getClientIp(request);
  const quota = await enforceAiQuota(`anon:${clientIp}`, false, env);
  if (!quota.allowed) {
    return jsonResponse(
      {
        quotaExceeded: true,
        error: `Rate limit exceeded. Please try again in ${quota.retryAfterSeconds || 60} seconds.`,
      },
      429,
      corsHeaders
    );
  }

  // Safe fallback if Workers AI binding is unconfigured
  if (!env.AI) {
    return jsonResponse(
      {
        quotaExceeded: true,
        reply: language === 'ur'
          ? 'آرٹس اپیرل کے سٹائلنگ کنسلٹنٹ سے رابطہ کرنے کا شکریہ۔ برائے مہربانی فوری رہنمائی کے لیے ہمارے واٹس ایپ 03058165623 پر رابطہ فرمائیں۔'
          : 'Thank you for consulting ARTS APPAREL. Our AI styling service is temporarily unconfigured. Please connect with our master tailors on WhatsApp at 0305 8165623.',
      },
      200,
      corsHeaders
    );
  }

  const conversationHistory = messages
    .slice(-6)
    .map((m: any) => `${m.role === 'user' ? 'Customer' : 'ARTS Stylist'}: ${m.content}`)
    .join('\n');

  const fullPrompt = getChatPrompt(conversationHistory, language === 'ur' ? 'ur' : 'en');

  try {
    const result = await runAi(env, {
      prompt: fullPrompt,
      temperature: 0.8,
      max_tokens: 512,
    });

    const reply = result.text || 'I would be honored to assist you with our bespoke collection.';
    return jsonResponse({ reply }, 200, corsHeaders);
  } catch (err: any) {
    console.error('Workers AI Chat Error (Safe Log):', err?.message || 'Unknown error');
    if (err instanceof AiClientError && err.statusCode === 429) {
      return jsonResponse({ quotaExceeded: true, reply: err.message }, 429, corsHeaders);
    }
    return jsonResponse(
      {
        quotaExceeded: true,
        reply: 'Our AI stylist service is temporarily busy. For sizing, tailoring, and order status, our WhatsApp line at 0305 8165623 is active 24/7.',
      },
      200,
      corsHeaders
    );
  }
}
