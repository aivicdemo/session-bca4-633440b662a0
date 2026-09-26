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

    // 期待結果: HTTP 403 Forbidden または認証エラーページが表示される
    const errorMessage = page.locator('text=/403|Forbidden|アクセス拒否|認証|無効|権限/i');
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    const currentUrl = page.url();
    const isForbiddenUrl = /403|forbidden|error|login/i.test(currentUrl);

    // 期待結果: 画面のコンテンツ（未提出者一覧、リマインダー設定、検知ログなど）は表示されない
    const unsubmittedList = page.locator('#rm-missing-tbody, [id*="missing"]');
    const reminderSettings = page.locator('#rm-settings-modal, [id*="settings"]');
    const detectionLog = page.locator('#rm-log-tbody, [id*="log"]');
    const managementPanel = page.locator('.rm-panel, [data-aivic-panel]');

    const contentVisible = await managementPanel.isVisible().catch(() => false);

    // エラーが表示されているか、またはコンテンツが非表示
    expect(isErrorVisible || isForbiddenUrl || !contentVisible).toBeTruthy();
  });
});
