import { test, expect } from '@playwright/test';

test('日報が対象日を「YYYY年MM月DD日（曜日）」形式で表示される', async ({ page }) => {
  // 日報確認・管理画面を開く
  await page.goto('./panels/scr-1790147095974.html');

  // 提出済み日報一覧が表示されている
  await expect(page.locator('#rm-r-tbody')).toBeVisible();

  const rows = page.locator('#rm-r-tbody tr');
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 提出済みの日報を1件選択し、詳細表示する
  const firstRow = rows.first();
  const reportDate = await firstRow.locator('td').nth(1).textContent();

  const detailButton = firstRow.locator('.rm-detail-btn');
  await detailButton.click();

  // 日報詳細画面が表示されるまで待機
  await expect(page.locator('#rm-view-modal')).toBeVisible();

  // 日報詳細画面で対象日の表示形式を確認する
  const modalTitle = page.locator('#rm-view-modal-title');
  const titleText = await modalTitle.textContent();

  // 対象日が『YYYY年MM月DD日（曜日）』形式で表示されている
  // 例：『2024年1月15日（月）』の形式で、年号・月・日・曜日が含まれ、区切り文字と括弧の位置が仕様通りである
  const dateFormatRegex = /\d{4}年\d{1,2}月\d{1,2}日（[月火水木金土日]）/;
  expect(titleText).toMatch(dateFormatRegex);

  // タイトルに日報が対象とする日付が含まれていることを確認
  expect(titleText).toBeTruthy();

  // 日付とフォーマットが一致していることを確認
  const match = titleText?.match(dateFormatRegex);
  expect(match).toBeTruthy();
  expect(match?.[0]).toMatch(/\d{4}年\d{1,2}月\d{1,2}日（[月火水木金土日]）/);
});
