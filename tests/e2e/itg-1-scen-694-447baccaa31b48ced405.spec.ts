import { test, expect } from '@playwright/test';

test('SCEN-694: 未提出者が1人選択された場合、リマインダーメールが送信される', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者一覧タブに切り替え
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();
  await page.waitForTimeout(500);

  // 未提出者一覧から、未提出状態のユーザーを1人だけ選択する（チェックボックスで選択）
  const missingRows = page.locator('#rm-missing-tbody tr');
  const rowCount = await missingRows.count();
  expect(rowCount).toBeGreaterThan(0);

  const firstCheckbox = page.locator('#rm-missing-tbody input[type="checkbox"]').first();
  await firstCheckbox.check();

  // 「リマインダー送信」ボタンをクリックする
  const sendBtn = page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  // ダイアログで確認
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('リマインダーを送信');
    await dialog.accept();
  });

  // 画面上に「リマインダーメールが送信されました」というメッセージが表示されることを確認する
  const successMessage = page.locator('text=リマインダーを送信しました');
  await expect(successMessage).toBeVisible();

  // 待機
  await page.waitForTimeout(1000);

  // メール送信履歴タブに切り替え
  const mailTab = page.locator('[data-tab="mail"]');
  await mailTab.click();

  // メール送信履歴に記録されたことを確認
  const mailHistory = page.locator('#rm-mail-tbody');
  const reminderMail = mailHistory.locator('text=リマインダー');
  expect(await reminderMail.count()).toBeGreaterThan(0);
});
