// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1, // vault filesystem shared — sequential execution
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:9097',
    trace: 'on-first-retry',
    serviceWorkers: 'block', // prevent SW cache interference
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.js/,
      use: {
        extraHTTPHeaders: {
          Authorization: `Bearer ${process.env.VV_API_KEY || 'a2ZW765Q034qEV5sFenDie2DLPNA2ETDYdQRj8ykrBw'}`,
        },
      },
    },
    {
      name: 'e2e',
      testMatch: /e2e\/.*\.spec\.js/,
      dependencies: ['setup'],
      use: {
        storageState: './tests/.auth/state.json',
      },
    },
  ],
  globalSetup: './tests/setup/global-setup.js',
  globalTeardown: './tests/setup/global-teardown.js',
});
