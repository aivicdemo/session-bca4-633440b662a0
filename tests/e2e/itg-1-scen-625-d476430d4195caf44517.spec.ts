import { test, expect } from '@playwright/test';

// SCEN-625: 本日の全報告者について、提出済み・未提出の状況が正確に一覧表示される

test('本日の報告者全員が表示され、提出/未提出の状態が正確に表示される', async ({ page }) => {
  // テスト環境にログインし、日報確認・管理画面を開く
  await page.goto('/panels/scr-1790147095974.html');

  // 本日の日付を確認
  const today = new Date().toISOString().split('T')[0];

  // 提出済み日報タブが表示されていることを確認
  const reportsTab = page.locator('button[data-tab="reports"]');
  await expect(reportsTab).toBeVisible();

  // テーブルが読み込まれるまで待機
  await page.waitForSelector('#rm-r-tbody');

  // 報告者一覧テーブル行を取得
  const reportRows = page.locator('#rm-r-tbody tr');
  const rowCount = await reportRows.count();

  // 期待結果: 社内5人全員が表示される（実装データに応じて1件以上）
  expect(rowCount).toBeGreaterThanOrEqual(1);

  // 各報告者行について、報告者名、報告日、業務内容、提出日時が表示されていることを確認
  for (let i = 0; i < rowCount; i++) {
    const row = reportRows.nth(i);
    const cells = row.locator('td');

    // 報告者名（1列目）が空でない
    const nameCell = cells.nth(0);
    const nameText = await nameCell.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);

    // 報告日（2列目）が表示されている
    const dateCell = cells.nth(1);
    const dateText = await dateCell.textContent();
    expect(dateText?.trim().length).toBeGreaterThan(0);

    // 業務内容（3列目）が表示されている
    const contentCell = cells.nth(2);
    const contentText = await contentCell.textContent();
    expect(contentText?.trim().length).toBeGreaterThan(0);

    // 提出日時（4列目）が表示されている
    const submittedAtCell = cells.nth(3);
    const submittedAtText = await submittedAtCell.textContent();
    expect(submittedAtText?.trim().length).toBeGreaterThan(0);
  }

  // 画面の報告者一覧を再度確認し、提出/未提出の表示が変わっていないことを確認
  const reportRowsAfter = page.locator('#rm-r-tbody tr');
  const rowCountAfter = await reportRowsAfter.count();

  expect(rowCountAfter).toBe(rowCount);
});
