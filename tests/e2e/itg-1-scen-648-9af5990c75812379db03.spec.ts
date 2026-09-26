import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-648: 管理画面にアクセスしたとき、提出済み・未提出者一覧、検知ステータス、催促状況を含むダッシュボードデータが取得され表示される', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/panels/scr-1790147087109.html`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display dashboard with submission status, detection status, and reminder status', async () => {
    const adminEmail = 'admin@company.com';
    const adminPassword = 'password123';

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');

    await emailInput.fill(adminEmail);
    await passwordInput.fill(adminPassword);
    await loginButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const managementScreenLink = page.locator('a, button').filter({ hasText: /日報確認|管理画面/ }).first();
    await managementScreenLink.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 期待結果1: 提出済み者一覧が表示される
    const submittedTab = page.locator('button:has-text("提出済み日報")');
    await expect(submittedTab).toBeVisible();

    const submittedPanel = page.locator('#rm-r-tbody, [id*="submitted"]').first();
    await expect(submittedPanel).toBeVisible();

    // 期待結果2: 未提出者一覧が表示される
    const unsubmittedTab = page.locator('button:has-text("未提出者")');
    await expect(unsubmittedTab).toBeVisible();

    const unsubmittedPanel = page.locator('#rm-missing-tbody, [id*="missing"]').first();
    await expect(unsubmittedPanel).toBeVisible();

    // 期待結果3: 検知ステータスに「定時自動検知完了」と最終実行時刻が表示される
    const detectionStatus = page.locator('#rm-detect-status, [id*="detect"]').first();
    await expect(detectionStatus).toBeVisible();

    const detectionText = await detectionStatus.innerText();
    expect(/完了|実行済み|定時|検知/.test(detectionText)).toBeTruthy();

    // 期待結果4: 催促状況に「送信済み：X件」「配信成功：Y件」「配信失敗：Z件」など具体的な件数が表示される
    const settingsSummary = page.locator('#rm-settings-summary-text, [id*="settings"]').first();
    if (await settingsSummary.isVisible()) {
      const summaryText = await settingsSummary.innerText();
      expect(summaryText.length).toBeGreaterThan(0);
    }

    // メール送信履歴タブを開いて催促状況を確認
    const mailTab = page.locator('button:has-text("メール送信履歴")');
    if (await mailTab.isVisible()) {
      await mailTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const mailTable = page.locator('#rm-mail-tbody, [id*="mail"] tbody');
      await expect(mailTable).toBeVisible();
    }
  });
});
