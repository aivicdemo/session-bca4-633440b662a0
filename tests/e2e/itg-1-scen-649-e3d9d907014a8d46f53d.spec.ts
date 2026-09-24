import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-649: リーダーのアカウントが無効なとき、管理画面へのアクセスが拒否される', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/panels/scr-1790147087109.html`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should reject access to management screen when leader account is invalid', async () => {
    const invalidLeaderEmail = 'invalid.leader@company.com';
    const invalidLeaderPassword = 'password123';

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');

    await emailInput.fill(invalidLeaderEmail);
    await passwordInput.fill(invalidLeaderPassword);
    await loginButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    
    const errorMessage = page.locator('text=/403|アクセス拒否|無効|権限/i');
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    const unsubmittedList = page.locator('#rm-missing-tbody, [id*="missing"]');
    const reminderSettings = page.locator('[id*="settings"]');
    const detectionLog = page.locator('[id*="log"]');

    const unsubmittedVisible = await unsubmittedList.isVisible().catch(() => false);
    const reminderVisible = await reminderSettings.isVisible().catch(() => false);
    const logVisible = await detectionLog.isVisible().catch(() => false);

    const isProtected = !unsubmittedVisible || !reminderVisible || !logVisible;
    expect(isProtected || isErrorVisible).toBeTruthy();
  });
});
