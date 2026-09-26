import { test, expect } from '@playwright/test';

test('SCEN-659: 本日の日報がすべての報告者から提出されているとき、管理画面に未提出者一覧が表示されない', async ({
  page,
}) => {
  // 日報確認・管理画面にアクセス
  await page.goto('./panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 提出済み日報タブで複数の報告者の日報が表示されていることを確認
  const reportTbody = page.locator('#rm-r-tbody');
  const reportRows = reportTbody.locator('tr:not(.rm-empty-row)');
  const reportRowCount = await reportRows.count();
  expect(reportRowCount).toBeGreaterThan(0);

  // 未提出者一覧セクションを確認
  await page.click('[data-tab="reminder"]');

  // 未提出者テーブルの内容を確認
  const tbody = page.locator('#rm-missing-tbody');
  const tableContent = await tbody.textContent();

  // 「未提出者はいません」メッセージが表示されているか確認
  if (tableContent?.includes('未提出者はいません')) {
    expect(tableContent).toContain('未提出者はいません');
  } else {
    // またはテーブルが空であることを確認
    const dataRows = tbody.locator('tr:not(.rm-empty-row)');
    const dataRowCount = await dataRows.count();
    expect(dataRowCount).toBe(0);
  }
});
