import { DEMO_PRODUCTS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatResponse {
  reply: string;
  products?: Array<{
    id: string;
    slug: string;
    name: string;
    price: number;
    image?: string;
  }>;
  quotaExceeded?: boolean;
}

export interface AISearchResponse {
  filters?: {
    category_slug?: string;
    color?: string;
    size?: string;
    max_price?: number;
    min_price?: number;
    keywords?: string[];
  };
  interpretedQuery?: string;
  quotaExceeded?: boolean;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isDemoMode && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {}
  }
  return headers;
}

export const aiService = {
  async chat(messages: AIChatMessage[], language: 'en' | 'ur'): Promise<AIChatResponse> {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, language }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('AI chat endpoint call failed, using graceful fallback:', e);
    }

    // In production, return honest unavailable response without fabricated products or prices
    if (!isDemoMode) {
      return {
        reply: language === 'ur'
          ? 'معذرت، ہمارا سٹائلنگ اسسٹنٹ اس وقت عارضی طور پر مصروف ہے۔ براہ راست معاونت کے لیے ہمارے واٹس ایپ 03058165623 پر رابطہ فرمائیں۔'
          : 'Our AI styling consultant is temporarily unavailable. For personal assistance, sizing advice, or direct orders, please reach out to our master tailors on WhatsApp at 0305 8165623.',
        quotaExceeded: true,
      };
    }

    // Explicit Demo Mode: Provide canned styling recommendations
    const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || '';

    if (lastMsg.includes('wedding') || lastMsg.includes('shadi') || lastMsg.includes('شادی')) {
      return {
        reply: language === 'ur'
          ? 'شادی اور بارات کی تقریب کے لیے ہماری رائل را سلک شیروانی اور مخملی بلیک واسکٹ سب سے شاندار انتخاب ہے۔ ان ملبوسات کی کڑھائی اور فٹنگ آپ کو پروقار تاثر دے گی۔'
          : 'For weddings and celebratory Barat occasions, our Royal Raw Silk Sherwani paired with a hand-tailored Embroidered Velvet Waistcoat offers an unrivaled distinguished presence.',
        products: [
          { id: 'prod-3', slug: 'royal-ivory-crimson-raw-silk-sherwani', name: 'Royal Ivory & Crimson Raw Silk Sherwani', price: 32500, image: DEMO_PRODUCTS[2]?.images?.[0]?.url },
          { id: 'prod-2', slug: 'velvet-midnight-black-embroidered-waistcoat', name: 'Velvet Midnight Black Embroidered Waistcoat', price: 5999, image: DEMO_PRODUCTS[1]?.images?.[0]?.url },
        ]
      };
    }

    if (lastMsg.includes('black') || lastMsg.includes('سیاہ') || lastMsg.includes('کالا')) {
      return {
        reply: language === 'ur'
          ? 'آرٹس اپیرل کی پہچان ہمارا امپیریل جیٹ بلیک شلوار قمیض اور سگنیچر ریڈ ٹائی ہے۔ یہ روزمرہ اور عید دونوں کے لیے شاندار ہیں۔'
          : 'Black is the soul of ARTS APPAREL. Our Imperial Jet Black Shalwar Kameez and obsidian outerwear represent our signature tailoring craft.',
        products: [
          { id: 'prod-1', slug: 'imperial-jet-black-shalwar-kameez', name: 'Imperial Jet Black Shalwar Kameez', price: 5499, image: DEMO_PRODUCTS[0]?.images?.[0]?.url },
          { id: 'prod-7', slug: 'crimson-red-silk-woven-tie', name: 'Crimson Red Silk Woven Tie', price: 1799, image: DEMO_PRODUCTS[6]?.images?.[0]?.url }
        ]
      };
    }

    return {
      reply: language === 'ur'
        ? 'آرٹس اپیرل میں خوش آمدید! آپ کسی بھی مخصوص لباس، فیبرک یا سائز کے متعلق رہنمائی حاصل کر سکتے ہیں۔ کیا آپ کو شادی، فارمل یا عام پہناوے کے لیے لباس درکار ہے؟'
        : 'Welcome to ARTS APPAREL styling concierge! I can help you select the ideal cut, recommend bespoke fits for events, or check delivery and fabrics.',
      products: [
        { id: 'prod-1', slug: 'imperial-jet-black-shalwar-kameez', name: 'Imperial Jet Black Shalwar Kameez', price: 5499, image: DEMO_PRODUCTS[0]?.images?.[0]?.url },
      ]
    };
  },

  async search(query: string): Promise<AISearchResponse> {
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('AI search call failed, using heuristic search:', e);
    }

    const q = query.toLowerCase();
    const filters: AISearchResponse['filters'] = {};

    if (q.includes('waistcoat') || q.includes('واسکٹ')) filters.category_slug = 'waistcoat';
    else if (q.includes('shalwar') || q.includes('kameez') || q.includes('شلوار')) filters.category_slug = 'shalwar-kameez';
    else if (q.includes('kurta') || q.includes('کرتا')) filters.category_slug = 'kurta';
    else if (q.includes('suit') || q.includes('سوٹ')) filters.category_slug = 'suits';
    else if (q.includes('sherwani') || q.includes('شیروانی')) filters.category_slug = 'sherwani';

    if (q.includes('black') || q.includes('سیاہ')) filters.color = 'black';
    if (q.includes('white') || q.includes('سفید')) filters.color = 'white';

    const priceMatch = q.match(/(?:under|below|کم)\s*(?:rs\.?|pkr)?\s*(\d+)/i) || q.match(/(\d{4,5})/);
    if (priceMatch) {
      filters.max_price = parseInt(priceMatch[1], 10);
    }

    return {
      filters,
      interpretedQuery: query,
    };
  },

  async explainSize(heightCm: number, weightKg: number, fit: string, recommendedSize: string): Promise<string> {
    try {
      const res = await fetch('/api/ai/size-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height_cm: heightCm, weight_kg: weightKg, fit, recommended_size: recommendedSize }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.text;
      }
    } catch {}

    return `Based on your height of ${heightCm} cm and weight of ${weightKg} kg with a ${fit} preference, size ${recommendedSize} offers our master tailor's recommended drape with balanced shoulder width and length.`;
  },

  async generateProductDescription(name: string, category: string, fabric: string, points: string[]): Promise<{ description_en: string; description_ur: string }> {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, category, fabric, points }),
      });
      if (res.ok) return await res.json();
    } catch {}

    return {
      description_en: `Expertly tailored from premium ${fabric || 'fine blend'}, this ${name} blends timeless Pakistani elegance with precision stitching. ${points.join('. ')}`,
      description_ur: `اعلیٰ درجے کے ${fabric || 'کپڑے'} سے تیار کردہ ${name}، نفاست اور پائیداری کا شاہکار امتزاج۔`
    };
  },

  async generateSeo(name: string, category: string, description: string): Promise<{ seo_title: string; seo_description: string; tags: string[] }> {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, category, description }),
      });
      if (res.ok) return await res.json();
    } catch {}

    return {
      seo_title: `${name} | ARTS APPAREL Menswear Pakistan`,
      seo_description: `Shop the ${name} online at ARTS APPAREL. Master tailored ${category} in Pakistan with nationwide Cash on Delivery.`,
      tags: [name.toLowerCase().split(' ')[0], category.toLowerCase(), 'pakistan-menswear', 'online-clothing']
    };
  },

  async generateReviewSummary(productId: string, productName: string, reviews: Array<{ rating: number; comment: string }>): Promise<{ summary_en: string; summary_ur: string }> {
    // Zero-review defense: Never fabricate sentiment if no reviews exist
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return {
        summary_en: 'Not enough reviews to summarize.',
        summary_ur: 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔',
      };
    }

    const headers = await getAuthHeaders();
    try {
      const res = await fetch('/api/ai/review-summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: productId, product_name: productName, reviews }),
      });
      if (res.ok) return await res.json();
    } catch {}

    // Deterministic statistical summary: strictly derived from supplied reviews without AI fabrication
    const avgRating = (reviews.reduce((sum, r) => sum + (Number(r?.rating) || 5), 0) / reviews.length).toFixed(1);
    return {
      summary_en: `Based on ${reviews.length} customer review(s) with an average rating of ${avgRating}/5 stars. Individual review feedback is detailed below.`,
      summary_ur: `گاہکوں کے ${reviews.length} جائزوں اور اوسط ریٹنگ ${avgRating}/5 ستاروں پر مبنی اعداد و شمار۔ انفرادی تبصرے نیچے ملاحظہ فرمائیں۔`,
    };
  }
};
