const { test, expect } = require('@playwright/test');
const { API_KEY } = require('../helpers/test-constants');

test.describe('Health & Diagnostics API', () => {
  test('GET /api/health returns 200 without auth', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('vault');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('uptime');
  });

  test('GET /api/health reports vault status', async ({ request }) => {
    const res = await request.get('/api/health');
    const body = await res.json();
    expect(typeof body.vault).toBe('boolean');
    if (body.vault) {
      expect(body.vaultPath).toBeTruthy();
    }
  });

  test('GET /api/test requires auth', async ({ request }) => {
    const res = await request.get('/api/test', {
      headers: { Authorization: '' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/test returns feature checks with auth', async ({ request }) => {
    const res = await request.get('/api/test');
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Response is a flat object with category keys, each having an "ok" field
    expect(body).toHaveProperty('server');
    expect(body).toHaveProperty('vault');
    expect(body.server.ok).toBe(true);
    expect(typeof body.vault.ok).toBe('boolean');
  });

  test('unauthorized request returns 401', async ({ request }) => {
    const res = await request.get('/api/tags', {
      headers: { Authorization: 'Bearer WRONG_KEY' },
    });
    expect(res.status()).toBe(401);
  });
});
