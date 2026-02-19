const { test, expect } = require('@playwright/test');
const { API_KEY } = require('../helpers/test-constants');

// Auth tests need a fresh browser — don't use saved storageState
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication flow', () => {
  test('shows auth screen on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#auth')).toBeVisible();
    await expect(page.locator('#app')).toBeHidden();
    await expect(page.locator('#key-input')).toBeVisible();
    await expect(page.locator('#auth-btn')).toBeVisible();
  });

  test('shows error for wrong API key', async ({ page }) => {
    await page.goto('/');
    await page.fill('#key-input', 'WRONG_KEY_12345');
    await page.click('#auth-btn');
    await expect(page.locator('#auth-err')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#auth-err')).toContainText('오류');
  });

  test('login succeeds with correct key', async ({ page }) => {
    await page.goto('/');
    await page.fill('#key-input', API_KEY);
    await page.click('#auth-btn');
    await expect(page.locator('#app')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#auth')).toBeHidden();
  });

  test('Enter key submits login', async ({ page }) => {
    await page.goto('/');
    await page.fill('#key-input', API_KEY);
    await page.press('#key-input', 'Enter');
    await expect(page.locator('#app')).toBeVisible({ timeout: 10_000 });
  });

  test('logout returns to auth screen', async ({ page }) => {
    await page.goto('/');
    await page.fill('#key-input', API_KEY);
    await page.click('#auth-btn');
    await expect(page.locator('#app')).toBeVisible({ timeout: 10_000 });

    // Navigate to settings tab where logout button lives
    await page.click('.tab-item:has-text("설정")');
    await expect(page.locator('#p-set')).toHaveClass(/active/);

    await page.click('#logout-btn');
    await expect(page.locator('#auth')).toBeVisible();
    await expect(page.locator('#app')).toBeHidden();
  });

  test('URL key param auto-login', async ({ page }) => {
    await page.goto(`/?key=${API_KEY}`);
    await expect(page.locator('#app')).toBeVisible({ timeout: 10_000 });
  });
});
