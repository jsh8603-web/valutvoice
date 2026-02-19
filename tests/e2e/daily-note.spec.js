const { test, expect } = require('@playwright/test');
const { TEST_DATE, PREFIX, API_KEY, BASE_URL } = require('../helpers/test-constants');

test.describe('Daily note / Today tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 10_000 });
  });

  test('today tab shows current date', async ({ page }) => {
    await page.click('.tab-item:has-text("오늘")');
    await expect(page.locator('#p-today')).toHaveClass(/active/);
    await expect(page.locator('#hdr')).toHaveText('오늘');

    const dateText = await page.locator('#today-date').textContent();
    expect(dateText).toContain('오늘');
  });

  test('date navigation prev/next works', async ({ page }) => {
    await page.click('.tab-item:has-text("오늘")');
    await expect(page.locator('#today-date')).toContainText('오늘');

    await page.click('#today-prev');
    const prevText = await page.locator('#today-date').textContent();
    expect(prevText).not.toContain('오늘');

    await page.click('#today-next');
    const nextText = await page.locator('#today-date').textContent();
    expect(nextText).toContain('오늘');
  });

  test('nonexistent date returns empty via API', async ({ request }) => {
    // Test the empty-date behavior through the API (more reliable than UI date manipulation)
    const res = await request.get(`${BASE_URL}/api/daily/2000-01-01`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    expect(res.status()).toBe(404);
  });

  test('today tab loads note content after seeding', async ({ page, request }) => {
    const content = `${PREFIX}daily_content_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    // Seed a note for today
    await request.post(`${BASE_URL}/api/daily/${today}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: { content, tags: ['e2e'], section: '메모' },
    });

    // Open today tab
    await page.click('.tab-item:has-text("오늘")');

    // Body should contain our content (rendered as markdown)
    await expect(page.locator('#today-body')).toContainText(content, { timeout: 5000 });
  });

  test('clicking date button resets to today', async ({ page }) => {
    await page.click('.tab-item:has-text("오늘")');
    await page.click('#today-prev');
    await page.click('#today-prev');

    await page.click('#today-date');
    await expect(page.locator('#today-date')).toContainText('오늘');
  });
});
