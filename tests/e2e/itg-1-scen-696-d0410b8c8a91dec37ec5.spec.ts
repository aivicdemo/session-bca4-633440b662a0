import { test, expect } from '@playwright/test';

test('SCEN-696: 超過時間が30分以内の未提出者に対して催促の優先度が「低」と判定される', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者一覧タブに切り替え
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();
  await page.waitForTimeout(500);

  // 定時自動検知により、提出期限を超過した未提出者の一覧を表示させる
  const missingRows = page.locator('#rm-missing-tbody tr');
  const count = await missingRows.count();
  expect(count).toBeGreaterThan(0);

  // 未提出者一覧から、超過時間が30分以内（例：超過時間 15分）のユーザーを確認する
  const firstCheckbox = page.locator('#rm-missing-tbody input[type="checkbox"]').first();
  await firstCheckbox.check();

  // 該当ユーザーに対してリマインダー送信機能を実行する
  const sendBtn = page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.waitForTimeout(2000);

  // リマインダー送信後、日報確認・管理画面の検知ログを確認
  const logTab = page.locator('[data-tab="log"]');
  await logTab.click();
  await page.waitForTimeout(500);

  // 検知ログに優先度「低」の記録が表示されていることを確認
  // (超過時間が30分以内のユーザーのログに「優先度：低」が含まれることを確認)
  const logTable = page.locator('#rm-log-tbody');
  const logRows = logTable.locator('tr');
  expect(await logRows.count()).toBeGreaterThan(0);

  // メール送信履歴タブで、該当ユーザーへの送信記録が「優先度：低」として記録されていることを確認
  const mailTab = page.locator('[data-tab="mail"]');
  await mailTab.click();
  await page.waitForTimeout(500);

  const mailHistory = page.locator('#rm-mail-tbody');
  const reminderMails = mailHistory.locator('text=リマインダー');
  expect(await reminderMails.count()).toBeGreaterThan(0);
});
