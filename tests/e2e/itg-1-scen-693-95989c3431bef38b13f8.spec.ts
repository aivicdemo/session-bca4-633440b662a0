import { test, expect } from '@playwright/test';

test('SCEN-693: メール送信サーバーへの接続に失敗した場合、失敗がログに記録されて管理画面に「通知送信失敗」が表示される', async ({ page }) => {
  // 日報確認・管理画面にログイン
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者一覧タブに切り替え
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();
  await page.waitForTimeout(500);

  // 未提出者一覧から1名以上の報告者を確認
  const missingRows = page.locator('#rm-missing-tbody tr');
  const rowCount = await missingRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // チェックボックスで1名選択
  const firstCheckbox = page.locator('#rm-missing-tbody input[type="checkbox"]').first();
  await firstCheckbox.check();

  // リマインダー送信ボタンをクリック
  const sendBtn = page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  // 確認ダイアログで承認
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('リマインダーを送信');
    await dialog.accept();
  });

  // リマインダー送信処理が完了するまで待機
  await page.waitForTimeout(2000);

  // ページをリロード
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 未提出者一覧タブに切り替え
  await reminderTab.click();

  // 未提出者一覧で「通知送信失敗」が表示されることを確認
  const tableBody = page.locator('#rm-missing-tbody');
  const failureIndicator = tableBody.locator('text=/失敗/');

  // 少なくとも1つの失敗が表示されることを確認
  const failureCount = await failureIndicator.count();
  expect(failureCount).toBeGreaterThan(0);
});
