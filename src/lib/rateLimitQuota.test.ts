import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAndConsumeAiQuota, _resetRateLimits } from './rateLimit';

test('checkAndConsumeAiQuota permits requests up to public limit and rejects on excess', async () => {
  _resetRateLimits();
  const testScope = `test-anon-${Date.now()}`;

  // Public limit is 20 requests per 10 minutes
  for (let i = 0; i < 20; i++) {
    const res = await checkAndConsumeAiQuota(testScope, false);
    assert.equal(res.allowed, true, `Request #${i + 1} should be allowed`);
  }

  // 21st request must be rejected
  const exceeded = await checkAndConsumeAiQuota(testScope, false);
  assert.equal(exceeded.allowed, false, '21st request must exceed public rate limit');
  assert.ok(exceeded.retryAfterSeconds && exceeded.retryAfterSeconds > 0, 'Retry after seconds must be provided');
});

test('checkAndConsumeAiQuota permits staff higher limit (60) and rejects on excess', async () => {
  _resetRateLimits();
  const testStaffScope = `test-staff-${Date.now()}`;

  // Staff limit is 60 requests
  for (let i = 0; i < 60; i++) {
    const res = await checkAndConsumeAiQuota(testStaffScope, true);
    assert.equal(res.allowed, true, `Staff request #${i + 1} should be allowed`);
  }

  // 61st request must be rejected
  const exceeded = await checkAndConsumeAiQuota(testStaffScope, true);
  assert.equal(exceeded.allowed, false, '61st request must exceed staff rate limit');
});
