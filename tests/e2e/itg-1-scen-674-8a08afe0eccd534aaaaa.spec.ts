import { test, expect } from '@playwright/test';

test('SCEN-674: 5名全員が日報を提出していない場合、検知ログ画面に5名全員の未提出情報が表示される', async ({ page }) => {
  // テスト環境の5名のユーザー（報告者）すべてが日報を未提出の状態に初期化（前提条件）
  // 定時自動検知が実行される時刻まで待機するか、定時検知機能を手動トリガー（前提条件）

  // 日報確認・管理画面に遷移し、検知ログ確認画面を開く
  await page.goto('/panels/scr-1790147095974.html');

  const logTab = page.locator('.rm-tab[data-tab="log"]');
  await logTab.click();

  // 検知ログ一覧が表示されていることを確認
  const logPanel = page.locator('[data-panel="log"]');
  await expect(logPanel).toBeVisible();

  // 期待結果: 検知ログ画面に5名全員の未提出情報が表示される
  const logTable = page.locator('#rm-log-tbody');
  const dataRows = logTable.locator('tr');
  const rowCount = await dataRows.count();

  // 5行のレコード（5名全員）が表示
  expect(rowCount).toBe(5);

  // 各行には報告者名、対象日付、検知日時が含まれている
  for (let i = 0; i < rowCount; i++) {
    const row = dataRows.nth(i);
    const cells = row.locator('td');

    // 報告者名（第1列）が存在し空白でない
    const nameCell = cells.nth(0);
    const nameText = await nameCell.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);

    // 対象日付（第2列）が存在し空白でない
    const dateCell = cells.nth(1);
    const dateText = await dateCell.textContent();
    expect(dateText?.trim().length).toBeGreaterThan(0);

    // 検知日時（第3列）が存在し、タイムスタンプ形式で表示
    const detectedCell = cells.nth(2);
    const detectedText = await detectedCell.textContent();
    expect(detectedText?.trim().length).toBeGreaterThan(0);
    // タイムスタンプの形式を確認（YYYY-MM-DD HH:MM 形式または同様のフォーマット）
    expect(detectedText).toMatch(/\d{4}-\d{2}-\d{2}/);
  }
});
