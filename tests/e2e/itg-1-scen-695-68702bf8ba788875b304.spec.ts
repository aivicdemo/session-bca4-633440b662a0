import { test, expect } from '@playwright/test';

test('SCEN-695: 未提出者が複数選択された場合、全員にリマインダーメールが送信される', async ({ page }) => {
  // 日報確認・管理画面にアクセスし、管理者権限で画面を開く
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者一覧タブに切り替え
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();
  await page.waitForTimeout(500);

  // 定時検知により未提出者一覧が表示されたことを確認する
  const missingRows = page.locator('#rm-missing-tbody tr');
  const rowCount = await missingRows.count();
  expect(rowCount).toBeGreaterThan(1);

  // 未提出者一覧から、未提出者2名以上を複数選択する（チェックボックスで選択）
  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();

  // 「リマインダー送信」ボタンをクリックする
  const sendBtn = page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  // ダイアログで確認
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('リマインダーを送信');
    await dialog.accept();
  });

  // 画面上にリマインダーメール送信処理が実行されたことを示すメッセージが表示されることを待つ
  await page.waitForTimeout(1000);

  // 送信完了後、画面上に「リマインダーを送信しました」のメッセージが表示されることを確認する
  const successMessage = page.locator('text=リマインダーを送信しました');
  await expect(successMessage).toBeVisible();

  // メール送信履歴タブに切り替え
  const mailTab = page.locator('[data-tab="mail"]');
  await mailTab.click();
  await page.waitForTimeout(500);

  // 複数のリマインダー送信が記録されていることを確認
  const mailHistory = page.locator('#rm-mail-tbody');
  const reminderMails = mailHistory.locator('text=リマインダー');
  expect(await reminderMails.count()).toBeGreaterThanOrEqual(2);
});
