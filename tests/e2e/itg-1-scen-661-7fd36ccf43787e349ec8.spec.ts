import { test, expect } from '@playwright/test';

test('SCEN-661: 検知ログ画面を開くと、未提出者の検知詳細情報が表示される', async ({ page }) => {
  // ステップ1-2: 日報確認・管理画面にログインして移動
  await page.goto('./panels/scr-1790147095974.html');

  // ステップ3: 検知ログタブをクリック
  await page.click('.rm-tab[data-tab="log"]');

  // 検知ログ画面が表示されるまで待機
  await page.waitForSelector('#rm-log-tbody');

  // ステップ4: 画面に表示される未提出者の検知ログ一覧テーブルを確認
  const logRows = await page.locator('#rm-log-tbody tr').count();
  
  // 期待結果: 少なくとも1件以上の未提出者検知ログレコードが表示されている
  expect(logRows).toBeGreaterThan(0);

  // テーブルヘッダーに以下の列が表示されている:
  // (1) 報告者名 (2) 対象日付 (3) 検知日時 (4) リマインダー送信済み (5) 提出状況
  const headers = await page.locator('.rm-table th').allTextContents();
  expect(headers).toContain('報告者名');
  expect(headers).toContain('対象日付');
  expect(headers).toContain('検知日時');
  expect(headers).toContain('リマインダー送信済み');
  expect(headers).toContain('提出状況');

  // 最初の行のデータを確認
  const firstRow = page.locator('#rm-log-tbody tr').first();
  const cells = await firstRow.locator('td').allTextContents();

  // (1) 報告者名（対象者）
  expect(cells[0]).toBeTruthy();
  
  // (2) 対象日付
  expect(cells[1]).toBeTruthy();
  
  // (3) 検知日時（年月日時分秒形式）
  expect(cells[2]).toMatch(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/);
  
  // (4) リマインダー送信状況
  expect(['送信済み', '未送信']).toContain(cells[3]);
  
  // (5) 提出状況（「未提出」など定時検知で判定された状態）
  expect(['未提出', '提出済み', '期限超過']).toContain(cells[4]);
});
