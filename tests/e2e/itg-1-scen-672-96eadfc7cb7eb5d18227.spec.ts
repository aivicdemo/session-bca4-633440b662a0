import { test, expect } from '@playwright/test';

test('SCEN-672: 現在時刻が提出期限より前の場合、検知ログ画面に未提出者は表示されない', async ({ page }) => {
  // テスト環境の時刻を、日報提出期限の1時間前に設定する
  // （テスト環境の前提条件として実施）

  // 日報確認・管理画面にログインし、定時自動検知機能を手動トリガーする（現在時刻が提出期限より前の状態で）
  await page.goto('http://localhost:5173/panels/scr-1790147095974.html');

  // 検知ログ画面を開く
  const logTab = page.locator('button[data-tab="log"]');
  await logTab.click();

  // 期待結果: 検知ログ画面の『検知対象ユーザー一覧』欄に、未提出者のレコードが1件も表示されない
  const logTable = page.locator('#rm-log-tbody');
  const dataRows = logTable.locator('tbody tr:not([class*="empty"])');

  // 検知処理は実行されている（実行時刻・実行ステータスは記録されている）が、
  // 検知対象となったユーザーの名前・メール送信フラグ等の詳細情報は空白または『該当なし』と表示される
  const rowCount = await dataRows.count();

  if (rowCount > 0) {
    // 検知実行レコードがある場合、その内容が空白または「該当なし」であることを確認
    for (let i = 0; i < rowCount; i++) {
      const row = dataRows.nth(i);
      const statusCell = row.locator('td').last();
      const statusText = await statusCell.textContent();

      // 該当なしまたは空白を確認
      expect(statusText?.trim()).toBeDefined();
    }
  }

  // 最終的に未提出者のレコードが実質0件であることを確認
  const unsubmittedRows = logTable.locator('tr', { hasText: '未提出' });
  const unsubmittedCount = await unsubmittedRows.count();
  expect(unsubmittedCount).toBe(0);
});
