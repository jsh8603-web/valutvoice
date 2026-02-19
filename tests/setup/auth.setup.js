const { test } = require('@playwright/test');
const { API_KEY } = require('../helpers/test-constants');

test('authenticate and save state', async ({ page }) => {
  await page.goto('/');

  // Auth screen should be visible
  await page.waitForSelector('#auth', { state: 'visible' });

  // Enter API key and click connect
  await page.fill('#key-input', API_KEY);
  await page.click('#auth-btn');

  // Wait for app to appear (auth succeeded)
  await page.waitForSelector('#app', { state: 'visible', timeout: 10_000 });

  // Save storage state (localStorage with vv_apiKey)
  await page.context().storageState({ path: './tests/.auth/state.json' });
});
