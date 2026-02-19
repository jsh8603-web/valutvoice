const { test, expect } = require('@playwright/test');
const { TEST_DATE, PREFIX, API_KEY } = require('../helpers/test-constants');

test.describe('Memo tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 10_000 });
  });

  test('memo tab is the default active tab', async ({ page }) => {
    await expect(page.locator('#p-memo')).toHaveClass(/active/);
    await expect(page.locator('#hdr')).toHaveText('메모');
  });

  test('section chips toggle correctly', async ({ page }) => {
    const memoChip = page.locator('#sec-chips .chip[data-s="메모"]');
    const todoChip = page.locator('#sec-chips .chip[data-s="오늘할일"]');

    await expect(memoChip).toHaveClass(/on/);

    await todoChip.click();
    await expect(todoChip).toHaveClass(/on/);
    await expect(memoChip).not.toHaveClass(/on/);

    // Todo options should become visible
    await expect(page.locator('#todo-options')).toBeVisible();

    // Switch back to memo
    await memoChip.click();
    await expect(memoChip).toHaveClass(/on/);
    await expect(page.locator('#todo-options')).toBeHidden();
  });

  test('memo date navigation works', async ({ page }) => {
    const dateText = await page.locator('#memo-date').textContent();
    expect(dateText).toContain('오늘');

    // Go to previous day
    await page.click('#memo-prev');
    const prevText = await page.locator('#memo-date').textContent();
    expect(prevText).not.toContain('오늘');

    // Reset to today
    await page.click('#memo-date');
    const resetText = await page.locator('#memo-date').textContent();
    expect(resetText).toContain('오늘');
  });

  test('save memo with text', async ({ page, request }) => {
    const testText = `${PREFIX}save_memo_${Date.now()}`;

    await page.fill('#memo-text', testText);
    await page.click('#save-btn');

    // Wait for save feedback
    await expect(page.locator('#save-fb')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#save-fb')).toContainText('저장 완료');

    // Textarea should be cleared after save
    await expect(page.locator('#memo-text')).toHaveValue('');

    // Clean up via API
    const today = new Date().toISOString().slice(0, 10);
    // Note: cleanup is best-effort; today's note may have other content
  });

  test('tag input and display', async ({ page }) => {
    await page.fill('#tag-in', 'e2e-test-tag');
    await page.press('#tag-in', 'Enter');

    await expect(page.locator('#tags-display')).toContainText('e2e-test-tag');

    // Remove tag by clicking X
    await page.click('#tags-display .tag-x');
    await expect(page.locator('#tags-display')).not.toContainText('e2e-test-tag');
  });

  test('empty memo cannot be saved', async ({ page }) => {
    await page.fill('#memo-text', '');
    await page.click('#save-btn');
    // No feedback shown, memo-text gets focused
    await expect(page.locator('#save-fb')).toBeHidden();
  });
});
