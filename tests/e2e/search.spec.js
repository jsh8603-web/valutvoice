const { test, expect } = require('@playwright/test');
const { TEST_DATE_2, PREFIX, API_KEY, BASE_URL } = require('../helpers/test-constants');

test.describe('Search / History tab', () => {
  const searchContent = `${PREFIX}search_e2e_unique_${Date.now()}`;

  test.beforeAll(async ({ request }) => {
    // Seed searchable note
    await request.post(`${BASE_URL}/api/daily/${TEST_DATE_2}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: {
        content: searchContent,
        tags: ['e2e-search'],
        section: '메모',
      },
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 10_000 });
    await page.click('.tab-item:has-text("기록")');
    await expect(page.locator('#p-hist')).toHaveClass(/active/);
  });

  test('history tab shows recent notes', async ({ page }) => {
    await expect(page.locator('#hdr')).toHaveText('기록');
    // Should show hist-list or loading
    await page.waitForTimeout(2000);
    const list = page.locator('#hist-list');
    // Either has items or shows empty message
    const childCount = await list.locator('> *').count();
    expect(childCount).toBeGreaterThan(0);
  });

  test('search finds seeded content', async ({ page }) => {
    await page.fill('#hist-search', PREFIX);
    await page.click('#search-btn');

    await expect(page.locator('#search-results')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#search-results')).toContainText(PREFIX);
  });

  test('empty search returns to history list', async ({ page }) => {
    // First do a search
    await page.fill('#hist-search', 'test');
    await page.click('#search-btn');
    await page.waitForTimeout(1000);

    // Clear and search again
    await page.fill('#hist-search', '');
    await page.click('#search-btn');
    await expect(page.locator('#hist-list')).toBeVisible();
  });

  test('no-result search shows empty message', async ({ page }) => {
    await page.fill('#hist-search', 'zzznonexistent999qqq_noresult');
    await page.click('#search-btn');

    await expect(page.locator('#search-results')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#search-results')).toContainText('검색 결과 없음');
  });

  test('clicking search result opens detail overlay', async ({ page }) => {
    await page.fill('#hist-search', PREFIX);
    await page.click('#search-btn');

    await expect(page.locator('#search-results .search-result-item').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('#search-results .search-result-item').first().click();

    await expect(page.locator('#hist-overlay')).toBeVisible();
    await page.click('#hist-close');
    await expect(page.locator('#hist-overlay')).toBeHidden();
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`${BASE_URL}/api/vm/delete?path=00.Daily/${TEST_DATE_2}.md`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
  });
});
