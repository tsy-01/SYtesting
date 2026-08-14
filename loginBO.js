/**
 * Login Script (Playwright)
 * ------------------------------------------------
 * Automatically fills in username and password.
 * The browser window stays open (headed mode) so you can
 * manually enter the captcha and click Login yourself.
 *
 * Setup:
 * npm install playwright dotenv
 * npx playwright install chromium
 *
 * .env should contain:
 * BASE_URL=https://stage-bo.linkv2.com/login
 * ADMIN_USERNAME=vernice@mv1
 * ADMIN_PASSWORD=sy123123
 *
 * Run:
 * node login.js
 */

require('dotenv').config();
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL;
const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!BASE_URL || !USERNAME || !PASSWORD) {
  console.error('Missing required environment variables. Please check that .env contains BASE_URL / ADMIN_USERNAME / ADMIN_PASSWORD.');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL);

    // ---- Adjust these selectors to match the actual page structure ----
    // Open DevTools (F12) and inspect each input field to find its real name/id/placeholder

    await page.fill('input[placeholder="Username"], input[name="username"]', USERNAME);
    await page.fill('input[placeholder="Password"], input[name="password"], input[type="password"]', PASSWORD);

    console.log('Username and password have been filled in automatically.');
    console.log('Please enter the captcha manually in the browser window, then click Login yourself.');
    console.log('The script will keep the browser open and will not close it automatically.');

    // Keep the script running and the browser open until you close the window manually
    await page.waitForEvent('close', { timeout: 0 }).catch(() => {});
  } catch (err) {
    console.error('An error occurred:', err);
    await browser.close();
  }
})();