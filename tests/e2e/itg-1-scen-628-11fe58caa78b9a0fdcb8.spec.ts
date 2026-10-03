import { test, expect } from '@playwright/test';

// SCEN-628: 集計対象日が未来の日付である場合、エラーメッセージが表示される

test('集計対象日が未来の日付の場合、エラーメッセージが表示される', async ({ page }) => {
  // 日報確認・管理画面にログイン
  await page.goto('/panels/scr-1790147095974.html');

  // 提出済み日報一覧表示機能にアクセス
  const reportsTab = page.locator('button[data-tab="reports"]');
  await expect(reportsTab).toBeVisible();
  if (!await reportsTab.locator('.is-active').isVisible()) {
    await reportsTab.click();
  }

  // 集計対象日の入力フィールドに未来の日付を入力
  const fromDateInput = page.locator('#rm-r-from');
  await expect(fromDateInput).toBeVisible();

  // 明日の日付を計算
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // 未来の日付を入力
  await fromDateInput.fill(tomorrowStr);

  // 集計対象日フィールドで確定またはフィルター実行ボタンを押す
  await fromDateInput.blur();

  // エラーメッセージが表示されるまで待機
  const toast = page.locator('.rm-toast, .toast, [role="alert"]');

  // 期待結果: 「集計対象日は本日以前の日付を指定してください」というエラーメッセージが表示される
  await expect(toast).toContainText(/集計対象日は本日以前の日付を指定してください/);

  // 入力フィールドは未来日付のまま保持
  const inputValue = await fromDateInput.inputValue();
  expect(inputValue).toBe(tomorrowStr);

  // 提出済み日報一覧の再読み込みが発生していないことを確認
  const tbody = page.locator('#rm-r-tbody');
  const initialRowCount = await tbody.locator('tr').count();

  // 少しの間待機してから、行数が変わっていないことを確認
  await page.waitForTimeout(500);
  const finalRowCount = await tbody.locator('tr').count();
  expect(finalRowCount).toBe(initialRowCount);
});
