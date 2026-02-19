const { test, expect } = require('@playwright/test');
const { TEST_DATE_2, PREFIX } = require('../helpers/test-constants');

test.describe('Search & Tags API', () => {
  // Seed a note to search for
  test.beforeAll(async ({ request }) => {
    await request.post(`/api/daily/${TEST_DATE_2}`, {
      data: {
        content: `${PREFIX}searchable_content_xyz789`,
        tags: ['e2e-search'],
        section: '메모',
      },
    });
  });

  test('GET /api/tags returns tag list', async ({ request }) => {
    const res = await request.get('/api/tags');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('tags');
    expect(Array.isArray(body.tags)).toBe(true);
  });

  test('GET /api/notes/recent returns recent notes', async ({ request }) => {
    const res = await request.get('/api/notes/recent');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('notes');
    expect(Array.isArray(body.notes)).toBe(true);
  });

  test('GET /api/search?q= finds content', async ({ request }) => {
    const res = await request.get(
      `/api/search?q=${encodeURIComponent(`${PREFIX}searchable`)}&scope=daily`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.results).toBeDefined();
    expect(body.results.length).toBeGreaterThan(0);
    // At least one result should contain our test text
    const hasMatch = body.results.some((r) =>
      r.matches.some((m) => m.text.includes(PREFIX))
    );
    expect(hasMatch).toBe(true);
  });

  test('GET /api/search returns empty for gibberish', async ({ request }) => {
    const res = await request.get(
      `/api/search?q=${encodeURIComponent('zzznonexistent999qqq')}&scope=daily`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.results.length).toBe(0);
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`/api/vm/delete?path=00.Daily/${TEST_DATE_2}.md`);
  });
});
