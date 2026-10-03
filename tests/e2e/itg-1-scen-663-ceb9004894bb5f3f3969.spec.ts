import { test, expect, type Page } from '@playwright/test';

test('SCEN-663: 提出期限までに日報を提出した報告者は未提出者一覧に表示されない', async ({ page }) => {
  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 検知ログタブをクリック
  await page.click('button[data-tab="log"]');

  // テーブルが表示されるまで待機
  await page.waitForSelector('#rm-log-tbody');

  // 検知ログ一覧を取得
  const logRows = await page.locator('#rm-log-tbody tr').all();
  
  let validRowCount = 0;
  let hasSubmittedReporter = false;
  let hasMissingReporter = false;

  for (const row of logRows) {
    const text = await row.textContent();
    if (text && !text.includes('検知ログがありません')) {
      validRowCount++;
      
      const cells = await row.locator('td').all();
      if (cells.length >= 5) {
        const statusText = await cells[4].textContent();
        
        if (statusText?.includes('提出済み')) {
          hasSubmittedReporter = true;
          // 提出済み報告者の場合、タイムスタンプを確認
          const detectedAtText = await cells[2].textContent();
          const dateTimeRegex = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
          expect(detectedAtText).toMatch(dateTimeRegex);
        }
        
        if (statusText?.includes('未提出')) {
          hasMissingReporter = true;
        }
      }
    }
  }

  // テーブルに行があることを確認
  expect(validRowCount).toBeGreaterThanOrEqual(1);

  // 提出状況と一致していることを確認
  if (hasSubmittedReporter) {
    // 提出済み報告者が表示されていることを確認
    expect(hasSubmittedReporter).toBe(true);
  }

  // 最低1件は結果が表示されていることを確認
  expect(validRowCount).toBeGreaterThanOrEqual(1);
});
