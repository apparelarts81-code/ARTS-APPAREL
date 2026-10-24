import { Env } from '../env';
import { jsonResponse } from '../utils/response';
import { parseJsonBody } from '../utils/validate';
import { AuthContext } from '../auth';
import { enforceAiQuota } from '../quota';
import { runAi } from './client';
import { getReviewSummaryPrompt } from './prompts';
import { reviewSummarySchema } from './schemas';

export async function handleAiReviewSummary(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  auth: AuthContext
): Promise<Response> {
  const parsed = await parseJsonBody(request, corsHeaders);
  if (parsed.errorResponse) return parsed.errorResponse;

  const { product_name, reviews } = parsed.data || {};

  // Zero-review defense: Never fabricate sentiment if no reviews exist
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return jsonResponse({
      summary_en: 'Not enough reviews to summarize.',
      summary_ur: 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔',
    }, 200, corsHeaders);
  }

  // Filter and sanitize valid reviews (max 25 reviews, comments up to 300 chars)
  const validReviews = reviews
    .slice(0, 25)
    .filter((r: any) => typeof r === 'object' && r && typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5)
    .map((r: any) => ({
      rating: Math.round(r.rating),
      comment: typeof r.comment === 'string' ? r.comment.slice(0, 300).trim() : '',
    }));

  if (validReviews.length === 0) {
    return jsonResponse({
      summary_en: 'Not enough reviews to summarize.',
      summary_ur: 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔',
    }, 200, corsHeaders);
  }

  // Deterministic statistical summary helper strictly derived from actual reviews
  const avgRating = (validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length).toFixed(1);
  const deterministicFallback = {
    summary_en: `Based on ${validReviews.length} customer review(s) with an average rating of ${avgRating}/5 stars. Individual review feedback is detailed below.`,
    summary_ur: `گاہکوں کے ${validReviews.length} جائزوں اور اوسط ریٹنگ ${avgRating}/5 ستاروں پر مبنی اعداد و شمار۔ انفرادی تبصرے نیچے ملاحظہ فرمائیں۔`,
    isDeterministic: true,
  };

  const quota = await enforceAiQuota(`staff:${auth.userId}`, true, env);
  if (!quota.allowed) {
    return jsonResponse(deterministicFallback, 200, corsHeaders);
  }

  if (!env.AI) {
    return jsonResponse(deterministicFallback, 200, corsHeaders);
  }

  const reviewTexts = validReviews
    .map((r) => `Rating ${r.rating}/5: "${r.comment}"`)
    .filter((line) => line.length > 12)
    .join('\n');

  if (!reviewTexts) {
    return jsonResponse(deterministicFallback, 200, corsHeaders);
  }

  const prompt = getReviewSummaryPrompt(product_name, reviewTexts);

  try {
    const result = await runAi(env, {
      prompt,
      temperature: 0.3,
      max_tokens: 512,
      jsonMode: true,
      schema: reviewSummarySchema,
    });

    const parsedJson = result.parsedJson || {};
    if (parsedJson.summary_en && parsedJson.summary_ur) {
      return jsonResponse(parsedJson, 200, corsHeaders);
    }

    return jsonResponse(deterministicFallback, 200, corsHeaders);
  } catch (err: any) {
    console.error('Workers AI Review Summary Error (Safe Log):', err?.message || 'Unknown error');
    return jsonResponse(deterministicFallback, 200, corsHeaders);
  }
}
