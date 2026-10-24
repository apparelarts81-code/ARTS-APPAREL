import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApiRequest } from './router';
import { Env } from './env';
import { cleanAndParseJson } from './ai/client';
import { checkIsolateRateLimit, _resetIsolateRateLimits, getClientIp } from './rate-limit';
import { enforceAiQuota } from './quota';
import { searchSchema, describeSchema, seoSchema, reviewSummarySchema } from './ai/schemas';

// Mock Test Environment
function createTestEnv(overrides: Partial<Env> = {}): Env {
  return {
    VITE_SITE_URL: 'https://artsapparel.pk',
    VITE_DEMO_MODE: 'true',
    ENVIRONMENT: 'development',
    ...overrides,
  };
}

test('cleanAndParseJson parses valid JSON directly', () => {
  const jsonStr = '{"category_slug":"shalwar-kameez","color":"black"}';
  const result = cleanAndParseJson(jsonStr);
  assert.equal(result.category_slug, 'shalwar-kameez');
  assert.equal(result.color, 'black');
});

test('cleanAndParseJson strips markdown code fences before parsing', () => {
  const fenced = '```json\n{"summary_en":"Excellent quality","summary_ur":"اعلی معیار"}\n```';
  const result = cleanAndParseJson(fenced);
  assert.equal(result.summary_en, 'Excellent quality');
  assert.equal(result.summary_ur, 'اعلی معیار');
});

test('cleanAndParseJson throws on invalid JSON string', () => {
  assert.throws(() => cleanAndParseJson('not a json string'));
});

test('rateLimit: checkIsolateRateLimit enforces limits and resets properly', () => {
  _resetIsolateRateLimits();
  const scope = 'test-ip-1';

  // 20 requests allowed for anon
  for (let i = 0; i < 20; i++) {
    const res = checkIsolateRateLimit(scope, false);
    assert.equal(res.allowed, true);
  }

  // 21st request should be rejected
  const blocked = checkIsolateRateLimit(scope, false);
  assert.equal(blocked.allowed, false);
  assert.ok(typeof blocked.retryAfterSeconds === 'number');
  assert.ok(blocked.retryAfterSeconds! > 0);
});

test('rateLimit: staff scope has higher limit (60 requests)', () => {
  _resetIsolateRateLimits();
  const scope = 'test-staff-1';

  for (let i = 0; i < 60; i++) {
    const res = checkIsolateRateLimit(scope, true);
    assert.equal(res.allowed, true);
  }

  const blocked = checkIsolateRateLimit(scope, true);
  assert.equal(blocked.allowed, false);
});

test('getClientIp retrieves CF-Connecting-IP header priority', () => {
  const req = new Request('https://artsapparel.pk/api/ai/chat', {
    headers: {
      'CF-Connecting-IP': '203.0.113.195',
      'X-Forwarded-For': '198.51.100.1',
    },
  });
  assert.equal(getClientIp(req), '203.0.113.195');
});

test('quota: enforceAiQuota fails closed in production when credentials are unconfigured', async () => {
  const prodEnv: Env = {
    ENVIRONMENT: 'production',
  };
  const result = await enforceAiQuota('anon:1.2.3.4', false, prodEnv);
  assert.equal(result.allowed, false);
  assert.ok(result.reason?.includes('fail-closed'));
});

test('router: OPTIONS request returns 204 with CORS headers', async () => {
  const env = createTestEnv();
  const req = new Request('https://artsapparel.pk/api/ai/chat', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://artsapparel.pk',
      'Access-Control-Request-Method': 'POST',
    },
  });

  const res = await handleApiRequest(req, env);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://artsapparel.pk');
});

test('router: unknown endpoint returns 404 JSON', async () => {
  const env = createTestEnv();
  const req = new Request('https://artsapparel.pk/api/ai/non-existent-endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const res = await handleApiRequest(req, env);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.ok(data.error.includes('not found'));
});

test('router: invalid content-type returns 415 Unsupported Media Type', async () => {
  const env = createTestEnv();
  const req = new Request('https://artsapparel.pk/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'hello world',
  });

  const res = await handleApiRequest(req, env);
  assert.equal(res.status, 415);
  const data = await res.json();
  assert.ok(data.error.includes('Expected application/json'));
});

test('router: wrong HTTP method returns 405 Method Not Allowed', async () => {
  const env = createTestEnv();
  const req = new Request('https://artsapparel.pk/api/ai/chat', {
    method: 'GET',
  });

  const res = await handleApiRequest(req, env);
  assert.equal(res.status, 405);
  const data = await res.json();
  assert.ok(data.error.includes('Method Not Allowed'));
});

// Endpoint 1: POST /api/ai/chat
test('POST /api/ai/chat validates messages array and returns valid shape', async () => {
  const env = createTestEnv();

  // Test empty messages rejected
  const reqInvalid = new Request('https://artsapparel.pk/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [] }),
  });
  const resInvalid = await handleApiRequest(reqInvalid, env);
  assert.equal(resInvalid.status, 400);

  // Test valid message
  const reqValid = new Request('https://artsapparel.pk/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Do you offer black shalwar kameez?' }],
      language: 'en',
    }),
  });
  const resValid = await handleApiRequest(reqValid, env);
  assert.equal(resValid.status, 200);
  const data = await resValid.json();
  assert.ok(typeof data.reply === 'string');
  assert.ok(data.reply.length > 0);
});

// Endpoint 2: POST /api/ai/search
test('POST /api/ai/search validates query and returns filters object', async () => {
  const env = createTestEnv();

  // Empty query rejected
  const reqEmpty = new Request('https://artsapparel.pk/api/ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '' }),
  });
  const resEmpty = await handleApiRequest(reqEmpty, env);
  assert.equal(resEmpty.status, 400);

  // Valid query
  const reqValid = new Request('https://artsapparel.pk/api/ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'black velvet waistcoat under 6000' }),
  });
  const resValid = await handleApiRequest(reqValid, env);
  assert.equal(resValid.status, 200);
  const data = await resValid.json();
  assert.ok(typeof data.filters === 'object');
});

// Endpoint 3: POST /api/ai/size-explain
test('POST /api/ai/size-explain validates height/weight bounds and returns explanation', async () => {
  const env = createTestEnv();

  // Out of bounds height
  const reqBad = new Request('https://artsapparel.pk/api/ai/size-explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ height_cm: 50, weight_kg: 70 }),
  });
  const resBad = await handleApiRequest(reqBad, env);
  assert.equal(resBad.status, 400);

  // Valid inputs
  const reqGood = new Request('https://artsapparel.pk/api/ai/size-explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      height_cm: 178,
      weight_kg: 75,
      fit: 'Tailored',
      recommended_size: 'L',
    }),
  });
  const resGood = await handleApiRequest(reqGood, env);
  assert.equal(resGood.status, 200);
  const data = await resGood.json();
  assert.ok(typeof data.text === 'string');
  assert.ok(data.text.includes('Size L'));
});

// Endpoint 4: POST /api/ai/describe
test('POST /api/ai/describe generates description in English and Urdu', async () => {
  const env = createTestEnv();
  const req = new Request('https://artsapparel.pk/api/ai/describe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-token',
    },
    body: JSON.stringify({
      name: 'Imperial Jet Black Shalwar Kameez',
      category: 'shalwar-kameez',
      fabric: 'Egyptian Cotton',
      points: ['Wrinkle resistant', 'Band collar'],
    }),
  });

  const res = await handleApiRequest(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(typeof data.description_en === 'string');
  assert.ok(typeof data.description_ur === 'string');
});

// Endpoint 5: POST /api/ai/translate
test('POST /api/ai/translate translates text and enforces length limits', async () => {
  const env = createTestEnv();

  // Test exceeding 1000 chars rejected
  const reqTooLong = new Request('https://artsapparel.pk/api/ai/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-token',
    },
    body: JSON.stringify({ text: 'a'.repeat(1001) }),
  });
  const resTooLong = await handleApiRequest(reqTooLong, env);
  assert.equal(resTooLong.status, 400);

  // Test valid translation
  const req = new Request('https://artsapparel.pk/api/ai/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-token',
    },
    body: JSON.stringify({ text: 'Welcome to ARTS APPAREL', from: 'en', to: 'ur' }),
  });
  const res = await handleApiRequest(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(typeof data.text === 'string');
});

// Endpoint 6: POST /api/ai/seo
test('POST /api/ai/seo returns seo_title, seo_description, and tags array', async () => {
  const env = createTestEnv();
  const req = new Request('https://artsapparel.pk/api/ai/seo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-token',
    },
    body: JSON.stringify({
      name: 'Korean Velvet Waistcoat',
      category: 'waistcoat',
      description: 'Hand-tailored embroidered velvet waistcoat in deep midnight black.',
    }),
  });

  const res = await handleApiRequest(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(typeof data.seo_title === 'string');
  assert.ok(typeof data.seo_description === 'string');
  assert.ok(Array.isArray(data.tags));
});

// Endpoint 7: POST /api/ai/review-summary (Zero-Review Defense & Fallback)
test('POST /api/ai/review-summary returns honest message when reviews array is empty (zero-review defense)', async () => {
  const env = createTestEnv();
  const req = new Request('https://artsapparel.pk/api/ai/review-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-token',
    },
    body: JSON.stringify({
      product_name: 'Bespoke Suit',
      reviews: [],
    }),
  });

  const res = await handleApiRequest(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.summary_en, 'Not enough reviews to summarize.');
  assert.equal(data.summary_ur, 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔');
});

test('POST /api/ai/review-summary generates deterministic summary when reviews exist', async () => {
  const env = createTestEnv();
  const req = new Request('https://artsapparel.pk/api/ai/review-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-token',
    },
    body: JSON.stringify({
      product_name: 'Imperial Jet Black Shalwar Kameez',
      reviews: [
        { rating: 5, comment: 'Exceptional tailoring and fine cotton cloth.' },
        { rating: 4, comment: 'Fitting was accurate and delivery on time.' },
      ],
    }),
  });

  const res = await handleApiRequest(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.summary_en.includes('customer review(s)'));
  assert.ok(data.summary_en.includes('4.5/5'));
  assert.equal(data.isDeterministic, true);
});

// Schemas validation check
test('schemas define required properties for Workers AI structured generation', () => {
  assert.ok(searchSchema.properties.category_slug);
  assert.ok(describeSchema.properties.description_en);
  assert.ok(describeSchema.properties.description_ur);
  assert.ok(seoSchema.properties.seo_title);
  assert.ok(reviewSummarySchema.properties.summary_en);
});

// Production Security Enforcement Tests
test('staff endpoints reject unauthenticated requests with 401 in production', async () => {
  const prodEnv: Env = {
    ENVIRONMENT: 'production',
    VITE_SITE_URL: 'https://artsapparel.pk',
  };

  const req = new Request('https://artsapparel.pk/api/ai/describe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Kurta' }),
  });

  const res = await handleApiRequest(req, prodEnv);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.ok(data.error.includes('Unauthorized'));
});

test('CORS rejects untrusted origin in production', async () => {
  const prodEnv: Env = {
    ENVIRONMENT: 'production',
    VITE_SITE_URL: 'https://artsapparel.pk',
  };

  const req = new Request('https://artsapparel.pk/api/ai/chat', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://malicious-site.com',
      'Access-Control-Request-Method': 'POST',
    },
  });

  const res = await handleApiRequest(req, prodEnv);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
});

