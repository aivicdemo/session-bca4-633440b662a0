import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-643: リーダーが管理画面にアクセスしたとき、有効なアカウントと管理画面アクセス権限を検証してから未提出者一覧が表示される', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/panels/scr-1790147087109.html`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display unsubmitted users list after authentication and authorization check', async () => {
    const leaderEmail = 'leader@company.com';
    const leaderPassword = 'password123';

    const emailInput = page.locator('input[type="email"], input[placeholder*="メール"], input[name*="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');

    await emailInput.fill(leaderEmail);
    await passwordInput.fill(leaderPassword);
    await loginButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const managementScreenLink = page.locator('a, button').filter({ hasText: /日報確認|管理画面/ }).first();
    await managementScreenLink.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const managementScreenContent = page.locator('[data-aivic-panel]');
    await expect(managementScreenContent).toBeVisible();

    const unsubmittedList = page.locator('#rm-missing-tbody, [id*="missing"], table tbody').first();
    await expect(unsubmittedList).toBeVisible();

    const unsubmittedRows = page.locator('tbody tr, [role="row"]');
    const rowCount = await unsubmittedRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    const errorMessage = page.locator('text=/アクセス権限がありません|アカウントが無効です/');
    await expect(errorMessage).not.toBeVisible();

    const firstRow = unsubmittedRows.first();
    const rowText = await firstRow.innerText();
    expect(rowText.length).toBeGreaterThan(0);
  });
});
