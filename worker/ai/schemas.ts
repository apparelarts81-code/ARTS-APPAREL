/**
 * JSON Schemas for Cloudflare Workers AI structured generation
 */

export const searchSchema = {
  type: 'object',
  properties: {
    category_slug: {
      type: ['string', 'null'],
      enum: [
        'shalwar-kameez',
        'kurta',
        'waistcoat',
        'sherwani',
        'suits',
        'shirts',
        'pants',
        'jackets',
        'caps',
        'ties',
        'track-suits',
        null,
      ],
    },
    color: {
      type: ['string', 'null'],
      enum: ['black', 'white', 'red', 'navy', 'green', 'grey', null],
    },
    size: {
      type: ['string', 'null'],
      enum: ['S', 'M', 'L', 'XL', '38', '40', '42', null],
    },
    max_price: { type: ['number', 'null'] },
    min_price: { type: ['number', 'null'] },
  },
  required: ['category_slug', 'color', 'size', 'max_price', 'min_price'],
};

export const describeSchema = {
  type: 'object',
  properties: {
    description_en: { type: 'string' },
    description_ur: { type: 'string' },
  },
  required: ['description_en', 'description_ur'],
};

export const seoSchema = {
  type: 'object',
  properties: {
    seo_title: { type: 'string' },
    seo_description: { type: 'string' },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['seo_title', 'seo_description', 'tags'],
};

export const reviewSummarySchema = {
  type: 'object',
  properties: {
    summary_en: { type: 'string' },
    summary_ur: { type: 'string' },
  },
  required: ['summary_en', 'summary_ur'],
};
