import { test, expect } from '@playwright/test';

test('SCEN-694: 未提出者が1人選択された場合、リマインダーメールが送信される', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('http://localhost:3000/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者一覧から、未提出状態のユーザーを1人だけ選択する（チェックボックスで選択）
  const missingRows = await page.locator('#rm-missing-tbody tr').count();
  expect(missingRows).toBeGreaterThan(0);

  const firstCheckbox = await page.locator('#rm-missing-tbody tr:first-child .rm-missing-checkbox');
  await firstCheckbox.check();

  // 「リマインダー送信」ボタンをクリックする
  const sendBtn = await page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  // ダイアログで確認
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('1件の未提出者にリマインダーを送信');
    await dialog.accept();
  });

  // 画面上に「リマインダーメールが送信されました」というメッセージが表示されることを確認する
  const successMessage = await page.locator('text=リマインダーを送信しました');
  await expect(successMessage).toBeDefined();

  // 待機
  await page.waitForTimeout(1000);

  // メール送信履歴に記録されたことを確認
  const mailHistory = await page.locator('#rm-mail-tbody');
  const reminderMail = await mailHistory.locator('text=リマインダー');
  expect(await reminderMail.count()).toBeGreaterThan(0);
});
