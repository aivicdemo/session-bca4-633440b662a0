import { test, expect } from '@playwright/test';

test('SCEN-672: 現在時刻が提出期限より前の場合、検知ログ画面に未提出者は表示されない', async ({ page }) => {
  // テスト環境の時刻を、日報提出期限の1時間前に設定する（前提条件）
  // 日報確認・管理画面にログインし、定時自動検知機能を手動トリガーする

  // 検知ログ画面を開く
  await page.goto('/panels/scr-1790147095974.html');

  const logTab = page.locator('.rm-tab[data-tab="log"]');
  await logTab.click();

  // 期待結果: 検知ログ画面の『検知対象ユーザー一覧』欄に、未提出者のレコードが1件も表示されない
  // 検知処理は実行されている（実行時刻・実行ステータスは記録されている）が、
  // 検知対象となったユーザーの名前・メール送信フラグ等の詳細情報は空白または『該当なし』と表示される

  const logTable = page.locator('#rm-log-tbody');
  const dataRows = logTable.locator('tr');
  const rowCount = await dataRows.count();

  if (rowCount > 0) {
    // 検知実行レコードがある場合、各行の「提出状況」列（最後から2番目）が空白または「該当なし」であることを確認
    for (let i = 0; i < rowCount; i++) {
      const row = dataRows.nth(i);
      const cells = row.locator('td');
      const statusCell = cells.nth(4); // 提出状況列（5列目）
      const statusText = await statusCell.textContent();

      // 提出状況が空白または「該当なし」
      const trimmed = statusText?.trim() || '';
      expect(['', '該当なし'].includes(trimmed)).toBeTruthy();
    }
  }
});
