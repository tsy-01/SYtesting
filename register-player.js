// Automates the full test-player lifecycle:
//   1. Create a new cash member in the BO admin panel.
//   2. Log that player into the public play site (stage-mem.linkv2.com).
//   3. Complete the site's forced first-login password change.
//
// Both login pages (BO admin and the play site) have an image CAPTCHA that cannot be
// auto-solved/bypassed, so those two steps must be done manually in the browser window
// this script opens: fields are auto-filled, you read the CAPTCHA and click the submit
// button. The script waits for you and takes over again once each step completes.
//
// Usage:
//   node register-player.js [currency] [usernameSuffix]
//   node register-player.js MYR sytest0814
//   node register-player.js CNY                 -> auto-generates sycny0813a, trying
//                                                   a, b, c... until an available one
//                                                   is found (checked via the site's
//                                                   own "Check Availability" button)
//
// currency defaults to MYR.
//
// On success the browser window is left open, logged in as the new player, so it's
// ready to use immediately. It only auto-closes on failure. A Markdown report is
// written to reports/<username>.md summarizing what was created.

require('dotenv').config({ path: require('path').join(__dirname, 'ssr acc.env') });
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BO_ORIGIN = 'https://stage-bo.linkv2.com';
const LOGIN_URL = `${BO_ORIGIN}/login`;
const CREATE_MEMBER_URL = `${BO_ORIGIN}/dashboard/cash/cash-member/create-compact`;
const LIST_MEMBER_URL = `${BO_ORIGIN}/dashboard/cash/cash-member/list-compact`;

const MEMBER_SITE_ORIGIN = 'https://stage-mem.linkv2.com';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const currency = process.argv[2] || 'MYR';
const explicitUsernameSuffix = process.argv[3] || null;

// Password used to create the player in BO and for its first member-site login.
const initialPlayerPassword = process.env.NEW_PLAYER_PASSWORD || 'qwert1234';
// Password the player is changed to on the forced first-login password change screen.
const finalPlayerPassword = process.env.NEW_PLAYER_FINAL_PASSWORD || 'sy123123';

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_USERNAME / ADMIN_PASSWORD - check "test acc.env".');
  process.exit(1);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Naming convention: sy<currency><MMDD><letter>, e.g. sycny0813a
function defaultUsernameBase(currencyCode) {
  const now = new Date();
  return `sy${currencyCode.toLowerCase()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
}

async function checkUsernameAvailable(page, candidate) {
  await page.locator('input[name="Username"]').fill(candidate);
  await page.locator('button:has-text("Check Availability")').click();
  try {
    await page.waitForSelector('text=This username is available', { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

async function createMember(page) {
  await page.goto(LOGIN_URL);
  await page.fill('input[placeholder="Username"]', ADMIN_USERNAME);
  await page.fill('input[placeholder="Password"]', ADMIN_PASSWORD);

  console.log('[BO] Admin username/password filled. Please enter the CAPTCHA and click Login...');
  console.log('[BO] Waiting for login to complete (up to 2 minutes)...');
  await page.waitForURL(`${BO_ORIGIN}/dashboard/**`, { timeout: 120000 });
  console.log('[BO] Login successful, creating member automatically...');

  await page.goto(CREATE_MEMBER_URL);

  let usernameSuffix;
  if (explicitUsernameSuffix) {
    usernameSuffix = explicitUsernameSuffix;
    if (!(await checkUsernameAvailable(page, usernameSuffix))) {
      throw new Error(`Username "${usernameSuffix}" is not available`);
    }
  } else {
    const base = defaultUsernameBase(currency);
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    usernameSuffix = null;
    for (const letter of letters) {
      const candidate = `${base}${letter}`;
      console.log(`[BO] Checking availability: x9048_${candidate} ...`);
      if (await checkUsernameAvailable(page, candidate)) {
        usernameSuffix = candidate;
        break;
      }
    }
    if (!usernameSuffix) {
      throw new Error(`No available username found for base "${base}" with suffixes a-z`);
    }
  }
  console.log(`[BO] Using username: x9048_${usernameSuffix}`);

  await page.locator('input[name="Password"]').fill(initialPlayerPassword);
  await page.locator('input[name="ConfirmPassword"]').fill(initialPlayerPassword);

  // Currency is a required dropdown, e.g. MYR / USD / USDT / SGD ...
  await page.locator('select[name="Currency"]').selectOption(currency);

  await page.locator('button[type="submit"]').click();

  // Submit triggers a SweetAlert2 confirmation dialog: "This action will change Member's settings!"
  await page.locator('.swal2-confirm:has-text("OK")').click();

  // On success the page redirects back to the member list
  await page.waitForURL(`${LIST_MEMBER_URL}**`, { timeout: 10000 });

  console.log(`[BO] Registration succeeded: x9048_${usernameSuffix} / ${currency}`);
  return usernameSuffix;
}

async function loginPlayerOnMemberSite(page, usernameSuffix) {
  await page.goto(MEMBER_SITE_ORIGIN);

  // Login on the play site uses the username WITHOUT the "x9048_" BO prefix.
  await page.locator('a, button').filter({ hasText: /^Login$/ }).first().click();
  await page.locator('input[name="txtUserName"]').fill(usernameSuffix);
  await page.locator('input[name="txtPassword"]').fill(initialPlayerPassword);

  console.log('[Member site] Username/password filled. Please enter the CAPTCHA and click Sign In...');
  console.log('[Member site] Waiting for login to complete (up to 2 minutes)...');
  await page.waitForURL(`${MEMBER_SITE_ORIGIN}/user/**`, { timeout: 120000 });

  if (page.url().includes('/user/changepassword')) {
    console.log('[Member site] First login requires a password change, filling it in automatically...');
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(0).fill(initialPlayerPassword); // Current Password
    await passwordFields.nth(1).fill(finalPlayerPassword);   // New Password
    await passwordFields.nth(2).fill(finalPlayerPassword);   // Confirm
    await page.locator('input[type="text"]').last().fill(finalPlayerPassword); // Password Hint

    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('text=Change password successfully', { timeout: 10000 });
    await page.locator('button:has-text("OK")').click();

    console.log(`[Member site] Password changed to "${finalPlayerPassword}". Login verified.`);
    return true;
  }

  console.log('[Member site] Logged in without a forced password change.');
  return false;
}

function writeReport({ usernameSuffix, currency, startedAt, finishedAt, memberSitePasswordChanged }) {
  const reportsDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `${usernameSuffix}.md`);

  const lines = [
    `# Player registration report: ${usernameSuffix}`,
    '',
    `- Started: ${startedAt.toISOString()}`,
    `- Finished: ${finishedAt.toISOString()}`,
    `- Currency: ${currency}`,
    `- BO admin username: x9048_${usernameSuffix}`,
    `- Member site login username: ${usernameSuffix} (no "x9048_" prefix)`,
    `- Initial password (used at BO creation + first member-site login): ${initialPlayerPassword}`,
    memberSitePasswordChanged
      ? `- Final password after forced change: ${finalPlayerPassword}`
      : '- No forced password change occurred; initial password is still current',
    `- Member site: ${MEMBER_SITE_ORIGIN}`,
    `- BO member list: ${LIST_MEMBER_URL}`,
    '',
    'Browser window was left open on success, logged in as this player.',
  ];

  fs.writeFileSync(reportPath, lines.join('\n'));
  return reportPath;
}

(async () => {
  const startedAt = new Date();
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const usernameSuffix = await createMember(page);
    const memberSitePasswordChanged = await loginPlayerOnMemberSite(page, usernameSuffix);

    // Land on the logged-in homepage so the window is immediately usable.
    await page.goto(MEMBER_SITE_ORIGIN);

    const finishedAt = new Date();
    const reportPath = writeReport({ usernameSuffix, currency, startedAt, finishedAt, memberSitePasswordChanged });

    console.log(`\nDone. Player x9048_${usernameSuffix} (${currency}) created and logged in.`);
    console.log(`Report written to ${reportPath}`);
    console.log('Browser window left open for you to use.');
  } catch (err) {
    console.error('Flow failed:', err);
    await page.screenshot({ path: 'register-error.png' });
    console.log('Saved failure screenshot to register-error.png');
    await browser.close();
  }
})();
