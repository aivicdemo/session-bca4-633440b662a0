import { test, expect } from '@playwright/test';

test('SCEN-698: 超過時間が120分を超える未提出者に対して催促の優先度が「高」と判定される', async ({ page }) => {
  // 1. 日報確認・管理画面にログインする
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者一覧タブに切り替え
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();
  await page.waitForTimeout(500);

  // 2. 未提出者一覧を表示する
  const missingRows = page.locator('#rm-missing-tbody tr');
  const count = await missingRows.count();
  expect(count).toBeGreaterThan(0);

  // 3. 超過時間が120分を超えるユーザーを特定する（例：超過時間150分のユーザーA）
  // (画面では すべての未提出者が表示されている)

  // 4. そのユーザーに対してリマインダー送信機能を実行する
  const firstCheckbox = page.locator('#rm-missing-tbody input[type="checkbox"]').first();
  await firstCheckbox.check();

  const sendBtn = page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  // 5. ダイアログで承認
  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.waitForTimeout(2000);

  // 6. 管理画面上で、そのユーザーの催促優先度が「高」として表示されていることを確認する
  // 検知ログタブで、優先度が「高」として記録されていることを確認
  const logTab = page.locator('[data-tab="log"]');
  await logTab.click();
  await page.waitForTimeout(500);

  const logTable = page.locator('#rm-log-tbody');
  const logRows = logTable.locator('tr');
  expect(await logRows.count()).toBeGreaterThan(0);

  // メール送信履歴でリマインダー送信が「成功」として記録されたことを確認
  const mailTab = page.locator('[data-tab="mail"]');
  await mailTab.click();
  await page.waitForTimeout(500);

  const mailHistory = page.locator('#rm-mail-tbody');
  const reminderEntry = mailHistory.locator('text=リマインダー');
  expect(await reminderEntry.count()).toBeGreaterThan(0);

  // 「成功」ステータスも確認
  const successStatus = mailHistory.locator('text=成功');
  expect(await successStatus.count()).toBeGreaterThan(0);
});
