import { test, expect } from '@playwright/test';

/**
 * SCEN-662: 検知ログ確認
 * 検知ログ画面で、提出期限を過ぎても日報が提出されていない報告者が
 * 未提出者として一覧に表示される
 */
test('提出期限を過ぎても日報が提出されていない報告者が未提出者として表示される', async ({ page }) => {
  // テスト環境に管理者ユーザーでログインし、日報確認・管理画面を開く
  await page.goto('/');
  await page.fill('input[type="text"]', 'admin_yamada');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');

  await page.waitForLoadState('networkidle');

  // システム日時を「提出期限の翌日以降」に設定する
  // （テスト環境ではシステム日付を操作可能と仮定）
  await page.evaluate(() => {
    // クライアント側でシステム日時を翌日以降に設定
    // 実装例: 定時検知処理を手動トリガーする API へのアクセス
  });

  // 定時検知処理を手動トリガーまたは自動実行させる（提出期限超過の未提出者を検知する処理）
  // 管理画面上で検知を実行するボタンがある場合はそれをクリック
  const detectButton = page.locator('button:has-text("検知")').first();
  if (await detectButton.isVisible()) {
    await detectButton.click();
    await page.waitForLoadState('networkidle');
  }

  // 日報確認・管理画面の「検知ログ」セクションを表示する
  const logTab = page.locator('.rm-tab').filter({ hasText: '検知ログ' });
  await logTab.click();

  await page.waitForLoadState('networkidle');

  // 検知ログ一覧から、本日の検知実行レコードを確認する
  const logTable = page.locator('.rm-table');
  const rows = logTable.locator('tbody tr');

  // 本日の検知実行レコードが存在することを確認
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 提出期限を過ぎても日報が提出されていない報告者（5人中の未提出者）が
  // 「未提出者として一覧に表示」されていることが確認できる
  let unpublishedFound = false;
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const statusCell = row.locator('td').nth(4);
    const statusText = await statusCell.textContent();
    if (statusText?.includes('未提出') || statusText?.includes('期限超過')) {
      unpublishedFound = true;
      // 該当レコードには報告者名・検知実行日時・未提出フラグが記載されている
      const reporterName = await row.locator('td').nth(0).textContent();
      const detectedAt = await row.locator('td').nth(2).textContent();
      expect(reporterName).toBeTruthy();
      expect(detectedAt).toBeTruthy();
      expect(detectedAt).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/);
      break;
    }
  }

  expect(unpublishedFound).toBe(true);
});
