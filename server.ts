import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { checkAndConsumeAiQuota } from './src/lib/rateLimit';

dotenv.config();

const app = express();
// Enforce 100kb request body size limit to protect server memory and prevent payload abuse
app.use(express.json({ limit: '100kb' }));

const apiKey = process.env.GEMINI_API_KEY;

// Server-side Supabase client for token verification and authorization
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let serverSupabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey) {
  serverSupabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

// Staff / Owner Authorization Middleware for Staff AI endpoints
async function requireStaffOrOwner(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (!serverSupabase && process.env.NODE_ENV !== 'production') {
      (req as any).verifiedUserId = 'dev-staff-local';
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token.' });
  }

  const token = authHeader.substring(7);

  if (serverSupabase) {
    try {
      const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid authentication session.' });
      }

      const { data: profile, error: profError } = await serverSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profError || !profile || (profile.role !== 'staff' && profile.role !== 'owner')) {
        return res.status(403).json({ error: 'Forbidden: Staff or Owner role required.' });
      }

      (req as any).verifiedUserId = user.id;
      return next();
    } catch {
      return res.status(500).json({ error: 'Authentication verification service error.' });
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    (req as any).verifiedUserId = 'dev-staff-local';
    return next();
  }

  return res.status(503).json({ error: 'Service Unavailable: Authentication service is not configured.' });
}

// Helper to extract safe client IP for anonymous scope key
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown-client';
}

// Initialize GoogleGenAI SDK on server side
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. AI Chat Endpoint (Public styling consultant)
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, language } = req.body;

    // Validate inputs
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array is required.' });
    }
    if (messages.length > 10) {
      return res.status(400).json({ error: 'Conversation history exceeds maximum of 10 messages.' });
    }
    for (const msg of messages) {
      if (typeof msg.content !== 'string' || msg.content.length > 500) {
        return res.status(400).json({ error: 'Message content exceeds maximum allowed length of 500 characters.' });
      }
    }

    // Rate limit check
    const clientIp = getClientIp(req);
    const quota = await checkAndConsumeAiQuota(`anon:${clientIp}`, false, serverSupabase);
    if (!quota.allowed) {
      return res.status(429).json({
        quotaExceeded: true,
        error: `Rate limit exceeded. Please try again in ${quota.retryAfterSeconds || 60} seconds.`,
      });
    }

    if (!ai) {
      return res.status(200).json({
        quotaExceeded: true,
        reply: language === 'ur'
          ? 'آرٹس اپیرل کے سٹائلنگ کنسلٹنٹ سے رابطہ کرنے کا شکریہ۔ برائے مہربانی فوری رہنمائی کے لیے ہمارے واٹس ایپ 03058165623 پر رابطہ فرمائیں۔'
          : 'Thank you for consulting ARTS APPAREL. Our AI styling service is temporarily unconfigured. Please connect with our master tailors on WhatsApp at 0305 8165623.',
      });
    }

    const conversationHistory = messages
      .slice(-6)
      .map((m: any) => `${m.role === 'user' ? 'Customer' : 'ARTS Stylist'}: ${m.content}`)
      .join('\n');

    const systemInstruction = `You are the master styling consultant for "ARTS APPAREL", an upscale Pakistani men's clothing brand based on Club Road, Sadiqabad, Pakistan.
Brand color identity: Pure Black, Crisp White, Crimson Red tie accent, and Crosshair mark.
Our garment collection features:
- Shalwar Kameez (Imperial Jet Black, Wash & Wear, Egyptian Cotton)
- Sherwanis (Ivory & Crimson Raw Silk)
- Waistcoats (Korean Velvet, Jamawar)
- Italian-Cut 2-Piece Suits
- Kurtas & Formal Menswear
- Accessories: Red silk ties, Karakul Caps, Quilted winter jackets.

Customer support details:
- Store location: Club Road, Near New Cafe Sajawal, Sadiqabad, Pakistan.
- WhatsApp: 0305 8165623
- Payment methods: Cash on Delivery (COD), JazzCash, Easypaisa, Bank transfer.
- Inspect return policy: 7-day return window.

Styling guidelines:
- Respond with sharp tailored elegance and respectful tone.
- Reply in ${language === 'ur' ? 'Urdu' : 'English'} (or Roman Urdu if the customer speaks Roman Urdu).
- For exact real-time prices or stock availability, advise customers to check the storefront product pages. Keep responses concise, helpful, and courteous.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemInstruction}\n\nRecent Conversation:\n${conversationHistory}\n\nProvide the next helpful stylist response:`,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const reply = response.text || 'I would be honored to assist you with our bespoke collection.';
    return res.json({ reply });
  } catch (err: any) {
    console.error('AI Chat Error (Safe Log):', err?.message || 'Unknown error');
    return res.status(200).json({
      quotaExceeded: true,
      reply: 'Our AI stylist service is temporarily busy. For sizing, tailoring, and order status, our WhatsApp line at 0305 8165623 is active 24/7.',
    });
  }
});

// 2. AI Natural Language Search
app.post('/api/ai/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required.' });
    }
    if (query.length > 200) {
      return res.status(400).json({ error: 'Search query exceeds 200 characters.' });
    }

    const clientIp = getClientIp(req);
    const quota = await checkAndConsumeAiQuota(`anon:${clientIp}`, false, serverSupabase);
    if (!quota.allowed) {
      return res.status(429).json({ quotaExceeded: true, error: 'Search rate limit exceeded.' });
    }

    if (!ai) {
      return res.status(200).json({ filters: {}, unavailable: true });
    }

    const prompt = `You are a search query parser for ARTS APPAREL menswear store in Pakistan.
User query: "${query.slice(0, 200)}"
Extract search criteria and return STRICT JSON in this exact shape:
{
  "category_slug": "shalwar-kameez" | "kurta" | "waistcoat" | "sherwani" | "suits" | "shirts" | "pants" | "jackets" | "caps" | "ties" | "track-suits" | null,
  "color": "black" | "white" | "red" | "navy" | "green" | "grey" | null,
  "size": "S" | "M" | "L" | "XL" | "38" | "40" | "42" | null,
  "max_price": number | null,
  "min_price": number | null
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ filters: parsed });
  } catch (err: any) {
    console.error('AI Search Error (Safe Log):', err?.message || 'Unknown error');
    return res.status(200).json({ filters: {}, unavailable: true });
  }
});

// 3. AI Size Explanation
app.post('/api/ai/size-explain', async (req: Request, res: Response) => {
  try {
    const { height_cm, weight_kg, fit, recommended_size } = req.body;
    const height = Number(height_cm);
    const weight = Number(weight_kg);

    if (isNaN(height) || height < 100 || height > 250 || isNaN(weight) || weight < 30 || weight > 200) {
      return res.status(400).json({ error: 'Valid height (100-250 cm) and weight (30-200 kg) are required.' });
    }
    const cleanFit = String(fit || 'Regular').slice(0, 20);
    const cleanSize = String(recommended_size || 'M').slice(0, 10);

    const clientIp = getClientIp(req);
    const quota = await checkAndConsumeAiQuota(`anon:${clientIp}`, false, serverSupabase);
    if (!quota.allowed) {
      return res.status(429).json({ error: 'Size explanation rate limit exceeded.' });
    }

    if (!ai) {
      return res.status(200).json({
        text: `Size ${cleanSize} is selected according to Pakistani tailoring standards for ${height} cm and ${weight} kg with a ${cleanFit} fit.`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain in 2 polite sentences why size "${cleanSize}" is the recommended fit for a customer with height ${height} cm, weight ${weight} kg, and preference "${cleanFit}" at ARTS APPAREL men's clothing store.`,
    });

    return res.json({ text: response.text });
  } catch {
    return res.status(200).json({
      text: `Size ${req.body?.recommended_size || 'M'} matches your entered height and weight profile according to our store size chart.`,
    });
  }
});

// 4. AI Product Description Generator for Staff (Protected)
app.post('/api/ai/describe', requireStaffOrOwner, async (req: Request, res: Response) => {
  try {
    const { name, category, fabric, points } = req.body;
    if (typeof name !== 'string' || name.length > 100) {
      return res.status(400).json({ error: 'Product name is required (max 100 chars).' });
    }
    const cleanCategory = String(category || '').slice(0, 50);
    const cleanFabric = String(fabric || 'fine fabric').slice(0, 100);
    const cleanPoints = Array.isArray(points)
      ? points.slice(0, 10).map((p: any) => String(p).slice(0, 100))
      : [];

    const quota = await checkAndConsumeAiQuota(`staff:${(req as any).verifiedUserId}`, true, serverSupabase);
    if (!quota.allowed) {
      return res.status(429).json({ error: 'Staff AI rate limit exceeded. Please wait a moment.' });
    }

    if (!ai) {
      return res.status(200).json({
        description_en: `Premium ${name} tailored from ${cleanFabric}.`,
        description_ur: `اعلیٰ درجے کے ${cleanFabric} سے تیار کردہ ${name}۔`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create an upscale product description for Pakistani menswear brand ARTS APPAREL.
Product Name: ${name}
Category: ${cleanCategory}
Fabric: ${cleanFabric}
Key Points: ${cleanPoints.join(', ')}

Return STRICT JSON:
{
  "description_en": "2-3 sentences in elegant English",
  "description_ur": "2-3 sentences in formal Urdu"
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    return res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error('AI Describe Error (Safe Log):', err?.message || 'Unknown error');
    return res.status(200).json({
      description_en: `Master tailored ${req.body.name} crafted from ${req.body.fabric || 'premium material'}.`,
      description_ur: `بہترین سلائی اور نفاست سے آراستہ ${req.body.name}۔`,
    });
  }
});

// 5. AI Translate (Protected)
app.post('/api/ai/translate', requireStaffOrOwner, async (req: Request, res: Response) => {
  try {
    const { text, from, to } = req.body;
    if (typeof text !== 'string' || text.length > 1000) {
      return res.status(400).json({ error: 'Text to translate is required (max 1000 chars).' });
    }
    const cleanFrom = String(from || 'en').slice(0, 10);
    const cleanTo = String(to || 'ur').slice(0, 10);

    const quota = await checkAndConsumeAiQuota(`staff:${(req as any).verifiedUserId}`, true, serverSupabase);
    if (!quota.allowed) {
      return res.status(429).json({ error: 'Staff AI rate limit exceeded.' });
    }

    if (!ai) return res.json({ text });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following text from ${cleanFrom} to ${cleanTo} for a luxury men's clothing store in Pakistan:\n\n${text}`,
    });

    return res.json({ text: response.text?.trim() });
  } catch {
    return res.json({ text: req.body?.text });
  }
});

// 6. AI SEO & Auto-Tags (Protected)
app.post('/api/ai/seo', requireStaffOrOwner, async (req: Request, res: Response) => {
  try {
    const { name, category, description } = req.body;
    if (typeof name !== 'string' || name.length > 100) {
      return res.status(400).json({ error: 'Product name is required (max 100 chars).' });
    }
    const cleanCategory = String(category || '').slice(0, 50);
    const cleanDescription = String(description || '').slice(0, 500);

    const quota = await checkAndConsumeAiQuota(`staff:${(req as any).verifiedUserId}`, true, serverSupabase);
    if (!quota.allowed) {
      return res.status(429).json({ error: 'Staff AI rate limit exceeded.' });
    }

    if (!ai) {
      return res.json({
        seo_title: `${name} | ARTS APPAREL Pakistan`,
        seo_description: cleanDescription.slice(0, 150) || `Buy ${name} at ARTS APPAREL.`,
        tags: [name.toLowerCase(), cleanCategory.toLowerCase()].filter(Boolean),
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate SEO metadata and tags for this menswear item:
Name: ${name}
Category: ${cleanCategory}
Description: ${cleanDescription}

Return STRICT JSON:
{
  "seo_title": "under 60 chars",
  "seo_description": "under 155 chars",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    return res.json(JSON.parse(response.text || '{}'));
  } catch {
    return res.json({
      seo_title: `${req.body?.name} | ARTS APPAREL Pakistan`,
      seo_description: req.body?.description?.slice(0, 150) || '',
      tags: ['menswear', 'clothing', 'pakistan'],
    });
  }
});

// 7. AI Review Sentiment Summary (Protected, Zero-review defense & Deterministic fallback)
app.post('/api/ai/review-summary', requireStaffOrOwner, async (req: Request, res: Response) => {
  try {
    const { product_name, reviews } = req.body;

    // Zero-review defense: Never fabricate sentiment if no reviews exist
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.json({
        summary_en: 'Not enough reviews to summarize.',
        summary_ur: 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔',
      });
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
      return res.json({
        summary_en: 'Not enough reviews to summarize.',
        summary_ur: 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔',
      });
    }

    // Deterministic statistical summary helper strictly derived from actual reviews
    const avgRating = (validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length).toFixed(1);
    const deterministicFallback = {
      summary_en: `Based on ${validReviews.length} customer review(s) with an average rating of ${avgRating}/5 stars. Individual review feedback is detailed below.`,
      summary_ur: `گاہکوں کے ${validReviews.length} جائزوں اور اوسط ریٹنگ ${avgRating}/5 ستاروں پر مبنی اعداد و شمار۔ انفرادی تبصرے نیچے ملاحظہ فرمائیں۔`,
      isDeterministic: true,
    };

    const quota = await checkAndConsumeAiQuota(`staff:${(req as any).verifiedUserId}`, true, serverSupabase);
    if (!quota.allowed) {
      return res.json(deterministicFallback);
    }

    if (!ai) {
      return res.json(deterministicFallback);
    }

    const reviewTexts = validReviews
      .map((r) => `Rating ${r.rating}/5: "${r.comment}"`)
      .filter((line) => line.length > 12)
      .join('\n');

    if (!reviewTexts) {
      return res.json(deterministicFallback);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Synthesize an objective 2-sentence sentiment summary strictly based on the provided customer reviews for this Pakistani menswear garment:
Product: ${product_name || 'Bespoke Garment'}
Customer Reviews:
${reviewTexts}

Return STRICT JSON:
{
  "summary_en": "2 concise sentences in English accurately summarizing the customer feedback",
  "summary_ur": "2 sentences in Urdu summarizing the same feedback in polite Urdu"
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.summary_en && parsed.summary_ur) {
      return res.json(parsed);
    }

    return res.json(deterministicFallback);
  } catch (err: any) {
    console.error('AI Review Summary Error (Safe Log):', err?.message || 'Unknown error');
    // If Gemini fails or errors, do NOT invent praise; return deterministic review statistics
    const reviews = Array.isArray(req.body?.reviews) ? req.body.reviews : [];
    if (reviews.length === 0) {
      return res.json({
        summary_en: 'Not enough reviews to summarize.',
        summary_ur: 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔',
      });
    }
    const avgRating = (reviews.reduce((sum: number, r: any) => sum + (Number(r?.rating) || 5), 0) / reviews.length).toFixed(1);
    return res.json({
      summary_en: `Based on ${reviews.length} customer review(s) with an average rating of ${avgRating}/5 stars. Individual review feedback is detailed below.`,
      summary_ur: `گاہکوں کے ${reviews.length} جائزوں اور اوسط ریٹنگ ${avgRating}/5 ستاروں پر مبنی اعداد و شمار۔ انفرادی تبصرے نیچے ملاحظہ فرمائیں۔`,
      isDeterministic: true,
    });
  }
});

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ARTS APPAREL Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the server when this file is run directly (not during unit testing)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
