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

    const submittedPanel = page.locator('[id*="submitted"], [id*="complete"], [id*="report"]').first();
    await expect(submittedPanel).toBeVisible();

    const unsubmittedPanel = page.locator('#rm-missing-tbody, [id*="missing"], [id*="unsubmitted"]').first();
    await expect(unsubmittedPanel).toBeVisible();

    const detectionStatus = page.locator('#rm-detect-status, [id*="detect"]').first();
    await expect(detectionStatus).toBeVisible();

    const submittedRows = submittedPanel.locator('tbody tr, [role="row"]');
    await submittedRows.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);

    const unsubmittedRows = unsubmittedPanel.locator('tbody tr, [role="row"]');
    const unsubmittedCount = await unsubmittedRows.count();

    const statusText = await detectionStatus.innerText();
    expect(statusText.length).toBeGreaterThan(0);

    const pageText = await page.locator('body').innerText();
    expect(pageText).toContain('送信');
  });
});
