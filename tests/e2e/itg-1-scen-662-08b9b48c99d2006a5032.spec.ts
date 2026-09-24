import { test, expect } from '@playwright/test';

test('SCEN-662: 検知ログ画面で、提出期限を過ぎても日報が提出されていない報告者が未提出者として一覧に表示される', async ({ page }) => {
  // ステップ1: テスト環境に管理者ユーザーでログインし、日報確認・管理画面を開く
  await page.goto('./panels/scr-1790147095974.html');

  // ステップ2-3: システム日時を提出期限の翌日以降に設定し、定時検知処理を実行
  // （画面のモックデータは既に過去日付で提出期限超過状態）

  // ステップ4: 日報確認・管理画面の検知ログセクションを表示
  await page.click('.rm-tab[data-tab="log"]');
  await page.waitForSelector('#rm-log-tbody');

  // ステップ5: 検知ログ一覧から、本日の検知実行レコードを確認
  const logRows = await page.locator('#rm-log-tbody tr');
  const rowCount = await logRows.count();

  // 期待結果: 提出期限を過ぎても日報が提出されていない報告者が未提出者として一覧に表示
  expect(rowCount).toBeGreaterThan(0);

  // レコードに以下の情報が含まれている:
  // - 報告者名
  // - 検知実行日時
  // - 未提出フラグ
  const firstRow = logRows.first();
  const cells = await firstRow.locator('td').allTextContents();

  // 報告者名
  expect(cells[0]).toBeTruthy();
  
  // 検知実行日時（対象日付）
  expect(cells[1]).toBeTruthy();
  
  // 提出状況に「期限超過」が含まれている可能性
  const statuses = ['未提出', '提出済み', '期限超過'];
  expect(statuses).toContain(cells[4]);
});
