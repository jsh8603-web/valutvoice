const { test, expect } = require('@playwright/test');

test.describe('Todo UI interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 10_000 });
  });

  test('todo section chips show priority options', async ({ page }) => {
    // Click 오늘할일 chip
    await page.click('#sec-chips .chip[data-s="오늘할일"]');
    await expect(page.locator('#todo-options')).toBeVisible();
    await expect(page.locator('#priority-chips')).toBeVisible();

    // Click a priority chip
    const highChip = page.locator('#priority-chips .priority-chip[data-p="높음"]');
    await highChip.click();
    await expect(highChip).toHaveClass(/on/);
  });

  test('priority chips are mutually exclusive', async ({ page }) => {
    await page.click('#sec-chips .chip[data-s="오늘할일"]');

    const highChip = page.locator('#priority-chips .priority-chip[data-p="높음"]');
    const normalChip = page.locator('#priority-chips .priority-chip[data-p="보통"]');

    await highChip.click();
    await expect(highChip).toHaveClass(/on/);

    await normalChip.click();
    await expect(normalChip).toHaveClass(/on/);
    await expect(highChip).not.toHaveClass(/on/);
  });

  test('due date input is visible in todo mode', async ({ page }) => {
    await page.click('#sec-chips .chip[data-s="오늘할일"]');
    await expect(page.locator('#todo-due')).toBeVisible();
  });

  test('todo options hide when switching back to memo', async ({ page }) => {
    await page.click('#sec-chips .chip[data-s="오늘할일"]');
    await expect(page.locator('#todo-options')).toBeVisible();

    await page.click('#sec-chips .chip[data-s="메모"]');
    await expect(page.locator('#todo-options')).toBeHidden();
  });
});
