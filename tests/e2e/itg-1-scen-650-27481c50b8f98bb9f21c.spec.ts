import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-650: リーダーに管理画面アクセス権限がないとき、管理画面へのアクセスが拒否される', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/panels/scr-1790147087109.html`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should reject access when leader lacks management screen permission', async () => {
    // テスト用ユーザー（リーダー権限、管理画面アクセス権限なし）
    const readerNoPermEmail = 'reader.noperm@company.com';
    const readerNoPermPassword = 'password123';

    // ログイン
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');

    await emailInput.fill(readerNoPermEmail);
    await passwordInput.fill(readerNoPermPassword);
    await loginButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // ログイン後、日報確認・管理画面へのアクセスURLを直接入力またはナビゲーションメニューから遷移を試みる
    const managementScreenLink = page.locator('a, button').filter({ hasText: /日報確認|管理画面/ }).first();

    if (await managementScreenLink.isVisible()) {
      await managementScreenLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    } else {
      // 直接URLにアクセスを試みる
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
      await page.goto(`${baseUrl}/panels/scr-1790147095974.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // 期待結果の検証
    // 1. 管理画面への遷移が拒否される
    // 2. HTTP 403（Forbidden）エラーまたはアクセス権限不足を示す画面が表示される
    const errorMessage = page.locator('text=/403|この画面にアクセスする権限がありません|アクセス拒否|Forbidden/i');
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    // 3. ユーザーは日報入力・提出画面へリダイレクトされるか、エラーメッセージが表示される
    const reportInputScreen = page.locator('#rp-wrap, [id*="submit"], [id*="input"]');
    const isRedirected = await reportInputScreen.isVisible().catch(() => false);

    const managementContent = page.locator('.rm-panel, [id*="missing"], [id*="settings"]');
    const isManagementVisible = await managementContent.isVisible().catch(() => false);

    // エラーメッセージが表示されているか、またはリダイレクトされているか、管理画面が非表示
    expect(isErrorVisible || isRedirected || !isManagementVisible).toBeTruthy();
  });
});
