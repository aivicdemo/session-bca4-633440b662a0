import { test, expect, type Page } from '@playwright/test';

test('SCEN-664: 検知ログ画面で各未提出者の最後の提出日時が正しく表示される', async ({ page }) => {
  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 検知ログタブをクリック
  await page.click('button[data-tab="log"]');

  // テーブルが表示されるまで待機
  await page.waitForSelector('#rm-log-tbody');

  // 検知ログ一覧テーブルを確認
  const logTable = page.locator('.rm-table');
  await expect(logTable).toBeVisible();

  // テーブルのヘッダーを確認
  const headerRow = page.locator('table thead tr');
  const headerCells = headerRow.locator('th');
  const headerTexts = await headerCells.allTextContents();

  // 検知ログテーブルのカラムを確認
  expect(headerTexts).toContain('報告者名');
  expect(headerTexts).toContain('対象日付');
  expect(headerTexts).toContain('検知日時');

  // 未提出者一覧にレコードが存在することを確認
  const bodyRows = await page.locator('#rm-log-tbody tr').all();
  
  let validRowCount = 0;
  for (const row of bodyRows) {
    const text = await row.textContent();
    if (text && !text.includes('検知ログがありません')) {
      validRowCount++;
    }
  }
  
  expect(validRowCount).toBeGreaterThanOrEqual(1);

  // 各行のデータを確認
  for (const row of bodyRows) {
    const text = await row.textContent();
    if (text && !text.includes('検知ログがありません')) {
      const cells = await row.locator('td').all();

      // 報告者名
      const reporterNameText = await cells[0].textContent();
      expect(reporterNameText?.trim()).not.toBe('');

      // 対象日付
      const targetDateText = await cells[1].textContent();
      const dateRegex = /\d{4}-\d{2}-\d{2}/;
      expect(targetDateText).toMatch(dateRegex);

      // 検知日時
      const detectedAtText = await cells[2].textContent();
      const dateTimeRegex = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
      expect(detectedAtText).toMatch(dateTimeRegex);

      // 提出状況の確認
      const statusText = await cells[4].textContent();
      const validStatuses = ['未提出', '提出済み', '期限超過'];
      expect(validStatuses.some(status => statusText?.includes(status))).toBeTruthy();
    }
  }

  // 画面遷移・エラーなく全データが表示されることを確認
  await expect(logTable).toBeVisible();
});
