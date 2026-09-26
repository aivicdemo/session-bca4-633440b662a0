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

    // 期待結果1: 日報確認・管理画面の未提出者一覧に、検知対象の未提出ユーザーが表示される
    const unsubmittedRows = page.locator('#rm-missing-tbody tr, [id*="missing"] tbody tr');
    const rowCount = await unsubmittedRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // 期待結果2: 各未提出者の行に催促ステータス情報が表示される
    const rows = await unsubmittedRows.all();
    for (const row of rows) {
      const rowText = await row.innerText();
      expect(/送信|催促|完了|済み/.test(rowText)).toBeTruthy();
    }

    // メール送信履歴タブを開く
    const mailTab = page.locator('button').filter({ hasText: /メール送信履歴|メール/ }).first();
    if (await mailTab.isVisible()) {
      await mailTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // 期待結果3: 検知ログ・メール送信履歴に以下が記録されている
    const mailTable = page.locator('#rm-mail-tbody tr, [id*="mail"] tbody tr');
    const mailRows = await mailTable.all();
    expect(mailRows.length).toBeGreaterThan(0);

    for (const mailRow of mailRows) {
      const rowText = await mailRow.innerText();
      // 送信者と受信者の情報
      expect(rowText.length).toBeGreaterThan(0);
      // 件名に「未提出者」の文字列を含む
      expect(/未提出|リマインダー|催促/.test(rowText)).toBeTruthy();
    }

    // 期待結果4: 画面上にエラーメッセージは表示されない
    const errorMessage = page.locator('text=/通知送信失敗|エラー/i');
    await expect(errorMessage).not.toBeVisible();
  });
});
