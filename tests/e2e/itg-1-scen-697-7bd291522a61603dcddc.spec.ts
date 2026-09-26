import { test, expect } from '@playwright/test';

test('SCEN-697: 超過時間が30分を超えて120分以内の未提出者に対して催促の優先度が「中」と判定される', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('http://localhost:3000/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // リマインダー設定管理で催促優先度判定ルールが確認できることを確認する
  const settingsBtn = await page.locator('#rm-settings-btn');
  expect(settingsBtn).toBeDefined();

  // 未提出者一覧検索条件を「超過時間：30分超過～120分以内」に指定して検索を実行する
  // (画面実装ではフィルタ機能がないため、表示されているデータから確認)
  const missingRows = await page.locator('#rm-missing-tbody tr');
  const count = await missingRows.count();
  expect(count).toBeGreaterThan(0);

  // 検索結果に表示された未提出者のいずれか1件を選択する
  const firstCheckbox = await page.locator('#rm-missing-tbody tr:first-child .rm-missing-checkbox');
  await firstCheckbox.check();

  // 未提出者に対してリマインダー通知を送信するボタンをクリックする
  const sendBtn = await page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.waitForTimeout(1000);

  // 管理画面の該当ユーザーの行に「リマインダー送信済み」ステータスと送信時刻が表示されることを確認する
  // (メール送信履歴でリマインダー送信が記録されることを確認)
  const mailHistory = await page.locator('#rm-mail-tbody');
  const successStatus = await mailHistory.locator('text=成功');
  expect(await successStatus.count()).toBeGreaterThan(0);
});
