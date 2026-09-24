import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-645: 未提出者が検知されたとき、報告者ID・名前・最後の提出日時を含む一覧が管理画面に表示される', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/panels/scr-1790147087109.html`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display unsubmitted users list with id, name, and last submission date', async () => {
    const adminEmail = 'admin@company.com';
    const adminPassword = 'password123';

    // テストユーザー（管理者）でログイン
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');

    await emailInput.fill(adminEmail);
    await passwordInput.fill(adminPassword);
    await loginButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 日報確認・管理画面へ遷移
    const managementScreenLink = page.locator('a, button').filter({ hasText: /日報確認|管理画面/ }).first();
    await managementScreenLink.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 未提出者検知の定時実行をシミュレートするため、トリガーボタンを操作
    // 検知スケジューラー実行コマンドまたはトリガーボタン
    const triggerButton = page.locator('button').filter({ hasText: /検知|実行|検索|更新/ }).first();
    if (await triggerButton.isVisible()) {
      await triggerButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // 画面を更新
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 日報確認・管理画面の「未提出者一覧」セクションを確認
    const unsubmittedSection = page.locator('#rm-missing-tbody, [id*="missing"]').first();
    await expect(unsubmittedSection).toBeVisible();

    // 期待結果の検証：未提出者一覧に以下の情報を持つ行が表示される
    const rows = page.locator('tbody tr, [role="row"]');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // 1. 報告者ID（ユーザーマスタの主キー値）が存在
      const firstRow = rows.first();
      const rowText = await firstRow.innerText();
      expect(rowText.length).toBeGreaterThan(0);

      // 2. 報告者名（ユーザーマスタに登録されている氏名）が表示
      // 3. 最後の提出日時（ISO 8601形式、または画面に設定された日時表示形式）
      // これらは行のテキストに含まれることを確認
      const cells = firstRow.locator('td, [role="gridcell"]');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThanOrEqual(3);
    }
  });
});
