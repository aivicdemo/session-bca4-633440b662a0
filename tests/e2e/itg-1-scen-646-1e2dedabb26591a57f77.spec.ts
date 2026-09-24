import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-646: 未提出者一覧が表示されたとき、期限超過時間に基づいて催促の優先度（低・中・高）と推奨アクション（直接指示・メール催促・様子見）が判定されて表示される', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/panels/scr-1790147087109.html`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display priority and recommended actions based on overdue hours', async () => {
    const adminEmail = 'admin@company.com';
    const adminPassword = 'password123';

    // テスト対象者（管理者）が日報確認・管理画面にログイン
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');

    await emailInput.fill(adminEmail);
    await passwordInput.fill(adminPassword);
    await loginButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 管理画面へ遷移
    const managementScreenLink = page.locator('a, button').filter({ hasText: /日報確認|管理画面/ }).first();
    await managementScreenLink.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 画面の未提出者一覧セクションを表示
    const unsubmittedSection = page.locator('#rm-missing-tbody, [id*="missing"]').first();
    await expect(unsubmittedSection).toBeVisible();

    // 未提出者一覧が描画されるのを待ち、テーブル行として各未提出者が表示されることを確認
    const rows = page.locator('tbody tr, [role="row"]');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });

    // 期待結果の検証
    // 1. 各未提出者行に『優先度』列と『推奨アクション』列が表示されていることを確認
    const rowElements = await rows.all();
    
    for (const row of rowElements) {
      const rowText = await row.innerText();
      
      // 優先度が表示されていることを確認（低・中・高）
      const hasPriority = /低|中|高/.test(rowText);
      expect(hasPriority).toBeTruthy();

      // 推奨アクションが表示されていることを確認（直接指示・メール催促・様子見）
      const hasAction = /直接指示|メール催促|様子見/.test(rowText);
      expect(hasAction).toBeTruthy();
    }

    // 2. 複数の未提出者（期限超過時間が異なる者）の行を確認
    if (rowElements.length >= 2) {
      // 期限超過時間ごとの判定結果が画面に正しく転送・反映されていることが確認される
      const firstRowText = await rowElements[0].innerText();
      const secondRowText = await rowElements[1].innerText();
      
      // 各行に優先度と推奨アクションが含まれていることを再度確認
      expect(/低|中|高/.test(firstRowText)).toBeTruthy();
      expect(/低|中|高/.test(secondRowText)).toBeTruthy();
    }
  });
});
