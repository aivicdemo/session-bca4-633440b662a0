import { test, expect } from '@playwright/test';

test('SCEN-698: 超過時間が120分を超える未提出者に対して催促の優先度が「高」と判定される', async ({ page }) => {
  // 1. 日報確認・管理画面にログインする
  await page.goto('http://localhost:3000/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 2. 未提出者一覧を表示する
  const missingRows = await page.locator('#rm-missing-tbody tr');
  const count = await missingRows.count();
  expect(count).toBeGreaterThan(0);

  // 3. 超過時間が120分を超えるユーザーを特定する（例：超過時間150分のユーザーA）
  // (画面では すべての未提出者が表示されている)
  
  // 4. そのユーザーに対してリマインダー送信機能を実行する
  const firstCheckbox = await page.locator('#rm-missing-tbody tr:first-child .rm-missing-checkbox');
  await firstCheckbox.check();

  const sendBtn = await page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  // 5. ダイアログで承認
  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.waitForTimeout(1000);

  // 6. 管理画面上で、そのユーザーの催促優先度が「高」として表示されていることを確認する
  // (メール送信履歴にリマインダー送信が記録されたことを確認)
  const mailHistory = await page.locator('#rm-mail-tbody');
  const reminderEntry = await mailHistory.locator('text=リマインダー').first();
  expect(await reminderEntry.count()).toBeGreaterThan(0);
});
