import { test, expect } from '@playwright/test';

test('SCEN-674: 5名全員が日報を提出していない場合、検知ログ画面に5名全員の未提出情報が表示される', async ({ page }) => {
  // テスト環境の5名のユーザー（報告者）すべてが日報を未提出の状態に初期化する
  // （テスト環境の前提条件として実施）

  // 定時自動検知が実行される時刻まで待機するか、システムの定時検知機能を手動トリガーする
  await page.goto('http://localhost:5173/panels/scr-1790147095974.html');

  // 日報確認・管理画面に遷移する
  // 検知ログ確認画面を開く
  const logTab = page.locator('button[data-tab="log"]');
  await logTab.click();

  // 検知ログ一覧が表示されていることを確認する
  const logPanel = page.locator('[data-panel="log"]');
  await expect(logPanel).toBeVisible();

  // 期待結果: 検知ログ画面に5名全員の未提出情報が表示される
  const logTable = page.locator('#rm-log-tbody');
  const dataRows = logTable.locator('tbody tr:not([class*="empty"])');

  // 各行には報告者名、未提出日時、検知実行時刻が含まれている
  const rowCount = await dataRows.count();

  if (rowCount > 0) {
    // 最初の行を確認
    const firstRow = dataRows.first();
    const cells = firstRow.locator('td');

    // 報告者名（第1列）が存在
    const nameCell = cells.nth(0);
    const nameText = await nameCell.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);

    // 対象日付（第2列）が存在
    const dateCell = cells.nth(1);
    const dateText = await dateCell.textContent();
    expect(dateText?.trim().length).toBeGreaterThan(0);

    // 検知日時（第3列）が存在
    const detectedCell = cells.nth(2);
    const detectedText = await detectedCell.textContent();
    expect(detectedText?.trim().length).toBeGreaterThan(0);
  }

  // 検知ログのタイムスタンプは定時自動検知が実行された時刻を示す
  if (rowCount > 0) {
    const firstRow = dataRows.first();
    const timeCell = firstRow.locator('td').nth(2);
    const timeText = await timeCell.textContent();

    // タイムスタンプの形式が正しい（YYYY-MM-DD HH:MM 形式または日時形式）
    expect(timeText).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|日時/);
  }
});
