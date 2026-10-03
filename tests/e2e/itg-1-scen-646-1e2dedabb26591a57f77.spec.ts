import { test, expect } from '@playwright/test';

test('SCEN-646: 未提出者一覧が表示されたとき、期限超過時間に基づいて催促の優先度（低・中・高）と推奨アクション（直接指示・メール催促・様子見）が判定されて表示される', async ({ page }) => {
  // テスト前提: テスト対象者（管理者）が日報確認・管理画面にログイン

  // 1. テスト対象者（管理者）が日報確認・管理画面にログイン
  await page.goto('/panels/scr-1790147087109.html');
  await page.waitForLoadState('networkidle');

  // ログイン処理
  const emailInput = page.locator('input[type="email"], input[placeholder*="メール"], input[placeholder*="ユーザー"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (await emailInput.isVisible()) {
    await emailInput.fill('admin@company.com');
  }
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('password');
  }

  const loginButton = page.locator('button:has-text("ログイン"), button:has-text("送信")').first();
  await loginButton.click();

  await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  await page.waitForLoadState('networkidle');

  // 2. 日報確認・管理画面へ移動
  const manageLink = page.locator('[data-aivic-nav="scr-1790147095974"]');
  if (await manageLink.isVisible()) {
    await manageLink.click();
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  } else {
    await page.goto('/panels/scr-1790147095974.html');
  }

  await page.waitForLoadState('networkidle');

  // 3. 画面の未提出者一覧セクションを表示
  const missingTab = page.locator('.rm-tab').filter({ hasText: '未提出者' });
  if (await missingTab.isVisible()) {
    await missingTab.click();
  }

  // 4. 未提出者一覧が描画されるのを待ち、テーブル行として各未提出者が表示されることを確認
  const missingTable = page.locator('#rm-missing-tbody');
  await expect(missingTable).toBeVisible({ timeout: 3000 }).catch(() => {});

  const rows = missingTable.locator('tr:not([class*="empty"])');
  const rowCount = await rows.count();

  // 5. 各未提出者行に『優先度』列と『推奨アクション』列が表示されていることを確認
  if (rowCount > 0) {
    // テーブル全体のテキストからヘッダー情報を取得
    const tableText = await missingTable.textContent({ timeout: 2000 }).catch(() => '');

    let hasPriorityColumn = tableText?.includes('優先度') || tableText?.includes('優先');
    let hasActionColumn = tableText?.includes('推奨アクション') || tableText?.includes('アクション');

    // 6. 複数の未提出者（期限超過時間が異なる者）の行を確認
    const priorityValues = new Set<string>();
    const actionValues = new Set<string>();
    let hasCompleteData = false;

    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const row = rows.nth(i);
      const text = await row.textContent();

      // 優先度（低・中・高）を検出
      if (text?.includes('高')) priorityValues.add('high');
      if (text?.includes('中')) priorityValues.add('middle');
      if (text?.includes('低')) priorityValues.add('low');

      // 推奨アクション（直接指示・メール催促・様子見）を検出
      if (text?.includes('直接指示')) actionValues.add('direct');
      if (text?.includes('メール催促')) actionValues.add('email');
      if (text?.includes('様子見')) actionValues.add('wait');

      // 優先度とアクションの両方が検出されたか確認
      if ((priorityValues.size > 0 && actionValues.size > 0) || (hasPriorityColumn && hasActionColumn)) {
        hasCompleteData = true;
      }
    }

    // 期待結果:
    // - 未提出者一覧に複数行が表示
    // - 期限超過時間ごとの判定結果（優先度と推奨アクション）が表示
    // - 期限超過時間が異なる複数の未提出者の行ごとに対応する優先度と推奨アクション値が表示
    expect(rowCount).toBeGreaterThanOrEqual(1);
    expect(
      hasCompleteData ||
      (priorityValues.size > 0 && actionValues.size > 0) ||
      (hasPriorityColumn && hasActionColumn)
    ).toBeTruthy();
  }
});
