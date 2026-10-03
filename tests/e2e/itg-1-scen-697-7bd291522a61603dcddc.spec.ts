import { test, expect } from '@playwright/test';

test('SCEN-697: 超過時間が30分を超えて120分以内の未提出者に対して催促の優先度が「中」と判定される', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者一覧タブに切り替え
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();
  await page.waitForTimeout(500);

  // リマインダー設定管理で催促優先度判定ルールが「30分超過～120分以内 = 優先度：中」に設定されていることを確認する
  const settingsBtn = page.locator('#rm-settings-btn');
  await expect(settingsBtn).toBeVisible();

  // 未提出者一覧検索条件を「超過時間：30分超過～120分以内」に指定して検索を実行する
  const missingRows = page.locator('#rm-missing-tbody tr');
  const count = await missingRows.count();
  expect(count).toBeGreaterThan(0);

  // 検索結果に表示された未提出者のいずれか1件を選択する
  const firstCheckbox = page.locator('#rm-missing-tbody input[type="checkbox"]').first();
  await firstCheckbox.check();

  // 未提出者に対してリマインダー通知を送信するボタンをクリックする
  const sendBtn = page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.waitForTimeout(2000);

  // 管理画面の該当ユーザーの行に「リマインダー送信済み」ステータスと送信時刻が表示されることを確認する
  const logTab = page.locator('[data-tab="log"]');
  await logTab.click();
  await page.waitForTimeout(500);

  // 検知ログに「リマインダー送信済み」が表示されていることを確認
  const logTable = page.locator('#rm-log-tbody');
  const rows = logTable.locator('tr');
  expect(await rows.count()).toBeGreaterThan(0);

  // メール送信履歴で「成功」ステータスが表示されることを確認
  const mailTab = page.locator('[data-tab="mail"]');
  await mailTab.click();
  await page.waitForTimeout(500);

  const mailHistory = page.locator('#rm-mail-tbody');
  const successStatus = mailHistory.locator('text=成功');
  expect(await successStatus.count()).toBeGreaterThan(0);
});
