import { test, expect } from '@playwright/test';

test('SCEN-673: 5名全員が日報を提出した場合、検知ログ画面に未提出者一覧は空で表示される', async ({ page }) => {
  // テストデータ準備: 5名全員のユーザー（報告者）を登録済み
  // 5名全員が日報内容を入力し、妥当性チェックを通過させて提出（前提条件）

  // 日報確認・管理画面を開く
  await page.goto('/panels/scr-1790147095974.html');

  // 画面内の「検知ログ」機能にアクセスする
  const logTab = page.locator('.rm-tab[data-tab="log"]');
  await logTab.click();

  // 期待結果: 検知ログ画面に表示されるテーブルが0件（空の状態）で表示される
  const logPanel = page.locator('[data-panel="log"]');
  await expect(logPanel).toBeVisible();

  const logTable = page.locator('#rm-log-tbody');
  const dataRows = logTable.locator('tr');
  const rowCount = await dataRows.count();

  // 検知ログのテーブル行が0件
  expect(rowCount).toBe(0);
});
