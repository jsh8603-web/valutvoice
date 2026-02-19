const { test, expect } = require('@playwright/test');
const { PREFIX } = require('../helpers/test-constants');

test.describe('Clipboard Sync API', () => {
  const clipText = `${PREFIX}clipboard_${Date.now()}`;

  test('POST /api/clipboard saves text', async ({ request }) => {
    const res = await request.post('/api/clipboard', {
      data: { text: clipText },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/clipboard retrieves text', async ({ request }) => {
    const res = await request.get('/api/clipboard');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.text).toBe(clipText);
    expect(body.updatedAt).toBeDefined();
    expect(typeof body.updatedAt).toBe('number');
  });

  test('clipboard round-trip preserves content', async ({ request }) => {
    const unique = `${PREFIX}roundtrip_${Date.now()}`;
    await request.post('/api/clipboard', { data: { text: unique } });
    const res = await request.get('/api/clipboard');
    const body = await res.json();
    expect(body.text).toBe(unique);
  });
});
