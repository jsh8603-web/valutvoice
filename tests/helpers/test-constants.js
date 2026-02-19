/** Shared constants for all tests */
module.exports = {
  API_KEY: process.env.VV_API_KEY || 'a2ZW765Q034qEV5sFenDie2DLPNA2ETDYdQRj8ykrBw',
  BASE_URL: 'http://127.0.0.1:9097',
  /** Future date that will never collide with real daily notes */
  TEST_DATE: '2099-12-31',
  /** Second test date for multi-day tests */
  TEST_DATE_2: '2099-12-30',
  /** Prefix for all test-generated content */
  PREFIX: 'E2E_TEST_',
  /** Auth header for API requests */
  authHeader(key) {
    return { Authorization: `Bearer ${key || this.API_KEY}` };
  },
};
