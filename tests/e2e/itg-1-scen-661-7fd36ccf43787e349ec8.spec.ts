import { test, expect, type Page } from '@playwright/test';

test('SCEN-661: 検知ログ画面に未提出者の検知詳細情報が表示される', async ({ page }) => {
  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 検知ログタブをクリック
  await page.click('button[data-tab="log"]');

  // テーブルが表示されるまで待機
  await page.waitForSelector('#rm-log-tbody');

  // 未提出者検知ログ一覧テーブルが表示されることを確認
  const logTable = page.locator('.rm-table');
  await expect(logTable).toBeVisible();

  // テーブルのヘッダー行を確認
  const headerCells = await page.locator('table thead th').allTextContents();
  expect(headerCells).toContain('検知日時');
  expect(headerCells).toContain('報告者名');

  // テーブルボディ内の行を確認
  const bodyRows = await page.locator('#rm-log-tbody tr').all();
  
  // 「検知ログがありません」という空行を除外したレコード数を確認
  let validRowCount = 0;
  for (const row of bodyRows) {
    const text = await row.textContent();
    if (text && !text.includes('検知ログがありません')) {
      validRowCount++;
    }
  }
  
  expect(validRowCount).toBeGreaterThanOrEqual(1);

  // 最初の有効な行の内容を確認
  for (const row of bodyRows) {
    const text = await row.textContent();
    if (text && !text.includes('検知ログがありません')) {
      const cells = await row.locator('td').all();
      
      // 最低5列あることを確認
      expect(cells.length).toBeGreaterThanOrEqual(5);

      // (1) 検知日時が年月日時分秒形式で表示されることを確認
      const detectedAtText = await cells[2].textContent();
      const dateTimeRegex = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
      expect(detectedAtText).toMatch(dateTimeRegex);

      // (2) 対象者（社内ユーザー名）が表示されることを確認
      const reporterNameText = await cells[0].textContent();
      expect(reporterNameText?.trim()).not.toBe('');

      // (3) 検知ステータス（提出状況）が表示されることを確認
      const statusText = await cells[4].textContent();
      const validStatuses = ['未提出', '提出済み', '期限超過'];
      expect(validStatuses.some(status => statusText?.includes(status))).toBeTruthy();

      // (4) リマインダー送信状況が表示されることを確認
      const reminderText = await cells[3].textContent();
      const validReminderStatuses = ['送信済み', '送信失敗', '未送信'];
      expect(validReminderStatuses.some(status => reminderText?.includes(status))).toBeTruthy();

      break; // 最初の有効な行のみ確認
    }
  }
});
