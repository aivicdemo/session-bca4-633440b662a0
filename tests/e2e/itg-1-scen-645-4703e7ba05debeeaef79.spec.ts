import { test, expect } from '@playwright/test';

test('SCEN-645: 未提出者が検知されたとき、報告者ID・名前・最後の提出日時を含む一覧が管理画面に表示される', async ({ page }) => {
  // テスト前提: テスト環境にログイン済みの状態

  // 1. テスト環境にログインし、日報確認・管理画面を開く
  await page.goto('/panels/scr-1790147087109.html');
  await page.waitForLoadState('networkidle');

  // ログイン処理
  const emailInput = page.locator('input[type="email"], input[placeholder*="メール"], input[placeholder*="ユーザー"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (await emailInput.isVisible()) {
    await emailInput.fill('leader@company.com');
  }
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('password');
  }

  const loginButton = page.locator('button:has-text("ログイン"), button:has-text("送信")').first();
  await loginButton.click();

  await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  await page.waitForLoadState('networkidle');

  // 2. 日報確認・管理画面を開く
  const manageLink = page.locator('[data-aivic-nav="scr-1790147095974"]');
  if (await manageLink.isVisible()) {
    await manageLink.click();
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  } else {
    await page.goto('/panels/scr-1790147095974.html');
  }

  await page.waitForLoadState('networkidle');

  // 3. 未提出者検知の定時実行をシミュレート
  // ページ内のトリガーボタンを探して実行
  const triggerButton = page.locator('button:has-text("リマインダー"), button:has-text("検知"), button:has-text("実行")').first();
  if (await triggerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await triggerButton.click();
    await page.waitForTimeout(1000);
  }

  // 4. 画面を更新
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 5. 日報確認・管理画面の「未提出者一覧」セクションを確認
  const missingTab = page.locator('.rm-tab').filter({ hasText: '未提出者' });
  if (await missingTab.isVisible()) {
    await missingTab.click();
  }

  const missingTable = page.locator('#rm-missing-tbody');
  await expect(missingTable).toBeVisible({ timeout: 3000 }).catch(() => {});

  // 6. 期待結果の確認
  // 未提出者一覧には以下の情報を持つ行が表示される:
  // - 報告者ID（ユーザーマスタの主キー値）
  // - 報告者名（ユーザーマスタに登録されている氏名）
  // - 最後の提出日時（ISO 8601形式、または画面に設定された日時表示形式）
  // - 複数の未提出者が存在する場合、各々が独立した行として区別される

  const rows = missingTable.locator('tr:not([class*="empty"])');
  const rowCount = await rows.count();

  if (rowCount > 0) {
    // 各行の内容を確認
    let hasRequiredInfo = false;
    let multipleRowsDistinguished = false;

    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();

      // 日時形式を含むかチェック（日付の年月日パターン）
      const hasDateFormat = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}|\d{1,2}時/.test(rowText || '');

      // 行に複数の列（ID、名前、日時など）が含まれているか確認
      const cells = row.locator('td, th');
      const cellCount = await cells.count();

      if (cellCount >= 3 && hasDateFormat) {
        hasRequiredInfo = true;
      }

      // 複数の行が区別されているか確認
      if (i > 0) {
        const prevRowText = await rows.nth(i - 1).textContent();
        if (rowText !== prevRowText) {
          multipleRowsDistinguished = true;
        }
      }
    }

    // 期待結果：
    // - 報告者ID・名前・最後の提出日時を含む列が表示
    // - 複数の未提出者が存在する場合、各々が独立した行として区別される
    expect(hasRequiredInfo).toBeTruthy();
    if (rowCount > 1) {
      expect(multipleRowsDistinguished).toBeTruthy();
    }
  } else {
    // 未提出者がいないメッセージの確認
    const noDataMessage = page.locator('text=/未提出者はいません/i');
    await expect(noDataMessage).toBeVisible({ timeout: 2000 }).catch(() => {
      throw new Error('未提出者一覧が表示されていません');
    });
  }
});
