const { test, expect } = require('@playwright/test');

test.describe('Settings tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 10_000 });
    await page.click('.tab-item:has-text("설정")');
    await expect(page.locator('#p-set')).toHaveClass(/active/);
  });

  test('settings tab loads and shows connection status', async ({ page }) => {
    await expect(page.locator('#hdr')).toHaveText('설정');
    await expect(page.locator('#st-conn')).toBeVisible({ timeout: 5000 });
    const connText = await page.locator('#st-conn').textContent();
    expect(['연결됨', '볼트없음', '오프라인']).toContain(connText);
  });

  test('vault path is displayed', async ({ page }) => {
    await expect(page.locator('#st-vault')).toBeVisible({ timeout: 5000 });
    const vaultText = await page.locator('#st-vault').textContent();
    expect(vaultText).not.toBe('-');
  });

  test('feature test button runs checks', async ({ page }) => {
    const btn = page.locator('#run-test');
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toBeVisible();
    await btn.click();

    await expect(btn).toContainText('점검 중');
    await expect(page.locator('#test-results')).not.toBeEmpty({ timeout: 30_000 });
  });

  test('clipboard UI elements exist', async ({ page }) => {
    const clipSection = page.locator('#clip-text');
    await clipSection.scrollIntoViewIfNeeded();
    await expect(clipSection).toBeVisible();
    await expect(page.locator('#clip-send')).toBeVisible();
    await expect(page.locator('#clip-recv')).toBeVisible();
  });

  test('QR code section is visible', async ({ page }) => {
    await expect(page.locator('#qr-area')).toBeVisible();
    await expect(page.locator('#qr-img')).toBeVisible();
  });

  test('logout button is visible and works', async ({ page }) => {
    const logoutBtn = page.locator('#logout-btn');
    await logoutBtn.scrollIntoViewIfNeeded();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await expect(page.locator('#auth')).toBeVisible();
  });
});
