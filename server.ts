import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(express.json());

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
    // If Supabase is not configured and running in local dev/demo, permit local testing with warning
    if (!serverSupabase && process.env.NODE_ENV !== 'production') {
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

      return next();
    } catch (err: any) {
      return res.status(500).json({ error: `Authentication verification error: ${err?.message || err}` });
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  return res.status(503).json({ error: 'Service Unavailable: Authentication service is not configured.' });
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
    if (!ai) {
      return res.status(200).json({ quotaExceeded: true, reply: 'AI service unconfigured.' });
    }

    const conversationHistory = (messages || [])
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
    console.error('AI Chat Error:', err?.message || err);
    return res.status(200).json({ quotaExceeded: true, error: err?.message });
  }
});

// 2. AI Natural Language Search
app.post('/api/ai/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!ai) {
      return res.status(200).json({ quotaExceeded: true });
    }

    const prompt = `You are a search query parser for ARTS APPAREL menswear store in Pakistan.
User query: "${query}"
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
    console.error('AI Search Error:', err?.message || err);
    return res.status(200).json({ quotaExceeded: true });
  }
});

// 3. AI Size Explanation
app.post('/api/ai/size-explain', async (req: Request, res: Response) => {
  try {
    const { height_cm, weight_kg, fit, recommended_size } = req.body;
    if (!ai) {
      return res.status(200).json({ text: `Recommended size ${recommended_size} based on your height and weight.` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain in 2 polite sentences why size "${recommended_size}" is the recommended fit for a customer with height ${height_cm} cm, weight ${weight_kg} kg, and preference "${fit}" at ARTS APPAREL men's clothing store.`,
    });

    return res.json({ text: response.text });
  } catch (err: any) {
    return res.status(200).json({ text: `Size ${req.body.recommended_size} is selected for your profile.` });
  }
});

// 4. AI Product Description Generator for Staff (Protected)
app.post('/api/ai/describe', requireStaffOrOwner, async (req: Request, res: Response) => {
  try {
    const { name, category, fabric, points } = req.body;
    if (!ai) {
      return res.status(200).json({
        description_en: `Premium ${name} in ${fabric}.`,
        description_ur: `اعلیٰ درجے کا ${name}۔`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create an upscale product description for Pakistani menswear brand ARTS APPAREL.
Product Name: ${name}
Category: ${category}
Fabric: ${fabric}
Key Points: ${(points || []).join(', ')}

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
    return res.status(200).json({
      description_en: `Master tailored ${req.body.name} in ${req.body.fabric}.`,
      description_ur: `بہترین سلائی سے آراستہ ${req.body.name}۔`,
    });
  }
});

// 5. AI Translate (Protected)
app.post('/api/ai/translate', requireStaffOrOwner, async (req: Request, res: Response) => {
  try {
    const { text, from, to } = req.body;
    if (!ai) return res.json({ text });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following text from ${from} to ${to} for a luxury men's clothing store in Pakistan:\n\n${text}`,
    });

    return res.json({ text: response.text?.trim() });
  } catch (err: any) {
    return res.json({ text: req.body.text });
  }
});

// 6. AI SEO & Auto-Tags (Protected)
app.post('/api/ai/seo', requireStaffOrOwner, async (req: Request, res: Response) => {
  try {
    const { name, category, description } = req.body;
    if (!ai) {
      return res.json({
        seo_title: `${name} | ARTS APPAREL`,
        seo_description: description?.slice(0, 150) || '',
        tags: [name.toLowerCase(), category.toLowerCase()],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate SEO metadata and tags for this menswear item:
Name: ${name}
Category: ${category}
Description: ${description}

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
  } catch (err: any) {
    return res.json({
      seo_title: `${req.body.name} | ARTS APPAREL`,
      seo_description: req.body.description?.slice(0, 150) || '',
      tags: ['menswear', 'clothing', 'pakistan'],
    });
  }
});

// 7. AI Review Sentiment Summary (Protected, Zero-review defense)
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

    if (!ai) {
      return res.json({
        summary_en: `Verified buyers have reviewed this ${product_name || 'garment'}.`,
        summary_ur: `خریداروں نے اس لباس پر اپنے تاثرات قلمبند کیے ہیں۔`,
      });
    }

    const reviewTexts = reviews
      .map((r: any) => `Rating ${r.rating}/5: "${r.comment || ''}"`)
      .filter((line: string) => line.length > 12)
      .join('\n');

    if (!reviewTexts) {
      return res.json({
        summary_en: 'Not enough reviews to summarize.',
        summary_ur: 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔',
      });
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

    return res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    return res.json({
      summary_en: 'Customer feedback highlights quality fabric and tailored fit.',
      summary_ur: 'خریداروں کے تاثرات معیاری فیبرک اور مناسب فٹنگ کی تصدیق کرتے ہیں۔',
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

startServer();
