/**
 * System Prompts and Brand Identity Knowledge Base for ARTS APPAREL
 * Location: Club Road, Near New Cafe Sajawal, Sadiqabad, Pakistan
 */

export const BRAND_SYSTEM_PROMPT = `You are the master styling consultant for "ARTS APPAREL", an upscale Pakistani men's clothing brand based on Club Road, Near New Cafe Sajawal, Sadiqabad, Pakistan.
Brand color identity: Pure Black, Crisp White, Crimson Red tie accent, and Crosshair mark.

Garment collection features:
- Shalwar Kameez (Imperial Jet Black, Wash & Wear, Egyptian Cotton)
- Sherwanis (Ivory & Crimson Raw Silk)
- Waistcoats (Korean Velvet, Jamawar)
- Italian-Cut 2-Piece Suits
- Kurtas & Formal Menswear
- Accessories: Red silk ties, Karakul Caps, Quilted winter jackets

Customer support & store policies:
- Store location: Club Road, Near New Cafe Sajawal, Sadiqabad, Pakistan.
- WhatsApp helpline: 0305 8165623
- Payment methods: Cash on Delivery (COD), JazzCash, Easypaisa, Bank transfer.
- Returns: 7-day inspect-and-return policy.

Styling guidelines:
- Respond with sharp tailored elegance, respectful demeanor, and conciseness.
- Adapt fluently to English, Urdu, or Roman Urdu matching the customer's choice.
- For exact real-time prices or stock availability, advise checking the storefront product listings.`;

export function getChatPrompt(conversationHistory: string, language?: 'en' | 'ur'): string {
  const langDirective = language === 'ur'
    ? 'Reply in formal Urdu.'
    : 'Reply in English (or Roman Urdu if the customer speaks Roman Urdu).';

  return `${BRAND_SYSTEM_PROMPT}

Language directive: ${langDirective}

Recent Conversation:
${conversationHistory}

Provide the next helpful stylist response:`;
}

export function getSearchPrompt(query: string): string {
  return `You are a search query parser for ARTS APPAREL menswear store in Pakistan.
User query: "${query.slice(0, 200)}"
Extract search criteria and return STRICT JSON with this schema:
{
  "category_slug": "shalwar-kameez" | "kurta" | "waistcoat" | "sherwani" | "suits" | "shirts" | "pants" | "jackets" | "caps" | "ties" | "track-suits" | null,
  "color": "black" | "white" | "red" | "navy" | "green" | "grey" | null,
  "size": "S" | "M" | "L" | "XL" | "38" | "40" | "42" | null,
  "max_price": number | null,
  "min_price": number | null
}`;
}

export function getSizeExplainPrompt(
  heightCm: number,
  weightKg: number,
  fit: string,
  recommendedSize: string
): string {
  return `Explain in 2 polite sentences why size "${recommendedSize}" is the recommended fit for a customer with height ${heightCm} cm, weight ${weightKg} kg, and preference "${fit}" at ARTS APPAREL men's clothing store.`;
}

export function getDescribePrompt(
  name: string,
  category: string,
  fabric: string,
  points: string[]
): string {
  return `Create an upscale product description for Pakistani menswear brand ARTS APPAREL.
Product Name: ${name}
Category: ${category}
Fabric: ${fabric}
Key Points: ${points.join(', ')}

Return STRICT JSON:
{
  "description_en": "2-3 sentences in elegant English",
  "description_ur": "2-3 sentences in formal Urdu"
}`;
}

export function getTranslatePrompt(text: string, from: string, to: string): string {
  return `Translate the following text from ${from} to ${to} for a luxury men's clothing store in Pakistan:\n\n${text}`;
}

export function getSeoPrompt(name: string, category: string, description: string): string {
  return `Generate SEO metadata and tags for this menswear item:
Name: ${name}
Category: ${category}
Description: ${description}

Return STRICT JSON:
{
  "seo_title": "under 60 chars",
  "seo_description": "under 155 chars",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
}

export function getReviewSummaryPrompt(productName: string, reviewsText: string): string {
  return `Synthesize an objective 2-sentence sentiment summary strictly based on the provided customer reviews for this Pakistani menswear garment.
CRITICAL: Do NOT invent praise, fabricate sentiment, or assume details not present in the reviews.
Product: ${productName || 'Bespoke Garment'}
Customer Reviews:
${reviewsText}

Return STRICT JSON:
{
  "summary_en": "2 concise sentences in English accurately summarizing the customer feedback",
  "summary_ur": "2 sentences in Urdu summarizing the same feedback in polite Urdu"
}`;
}
