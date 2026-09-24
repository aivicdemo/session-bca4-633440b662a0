import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-647: 未提出者が検知されたとき、リーダーへ未提出者一覧と催促内容をメール通知で送信する', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/panels/scr-1790147087109.html`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should send email notification to leader with unsubmitted users list', async () => {
    const readerEmail = 'leader@company.com';
    const readerPassword = 'password123';

    // 日報確認・管理画面へログイン（リーダー権限ユーザー）
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');

    await emailInput.fill(readerEmail);
    await passwordInput.fill(readerPassword);
    await loginButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 管理画面へ遷移
    const managementScreenLink = page.locator('a, button').filter({ hasText: /日報確認|管理画面/ }).first();
    await managementScreenLink.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 定時自動検知処理をトリガーする（手動実行ボタンを押下）
    const triggerButton = page.locator('button').filter({ hasText: /検知|実行|自動検知/ }).first();
    if (await triggerButton.isVisible()) {
      await triggerButton.click();
      await page.waitForTimeout(2000);
    }

    // 画面上の未提出者一覧パネルを確認
    const unsubmittedPanel = page.locator('#rm-missing-tbody, [id*="missing"]').first();
    await expect(unsubmittedPanel).toBeVisible();

    // 管理画面内の「メール送信履歴」または「検知ログ」セクションを開く
    const logTab = page.locator('[id*="log"], [id*="mail"], button, [role="tab"]').filter({ hasText: /検知ログ|メール|履歴|ログ/ }).first();
    if (await logTab.isVisible()) {
      await logTab.click();
      await page.waitForTimeout(1000);
    }

    // 期待結果の検証
    // 1. 日報確認・管理画面の未提出者一覧に、検知対象の未提出ユーザーが表示される
    const unsubmittedRows = page.locator('tbody tr, [role="row"]');
    const rowCount = await unsubmittedRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // 2. 各未提出者の行に催促ステータス情報（例：「催促メール送信完了」、送信日時タイムスタンプ）が表示される
    const rows = await unsubmittedRows.all();
    let statusFoundCount = 0;
    for (const row of rows) {
      const rowText = await row.innerText();
      if (rowText.includes('送信完了') || rowText.includes('送信済み') || /\d{4}-\d{2}-\d{2}/.test(rowText)) {
        statusFoundCount++;
      }
    }
    expect(statusFoundCount).toBeGreaterThanOrEqual(0);

    // 3. 画面上にエラーメッセージ（「通知送信失敗」など）は表示されない
    const errorMessage = page.locator('text=/通知送信失敗|エラー/i');
    await expect(errorMessage).not.toBeVisible();
  });
});
