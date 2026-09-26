import { test, expect } from '@playwright/test';

test('SCEN-695: 未提出者が複数選択された場合、全員にリマインダーメールが送信される', async ({ page }) => {
  // 日報確認・管理画面にアクセスし、管理者権限で画面を開く
  await page.goto('http://localhost:3000/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 定時検知により未提出者一覧が表示されたことを確認する
  const missingRows = await page.locator('#rm-missing-tbody tr').count();
  expect(missingRows).toBeGreaterThan(1);

  // 未提出者一覧から、未提出者2名以上を複数選択する（チェックボックスで選択）
  const checkboxes = await page.locator('#rm-missing-tbody .rm-missing-checkbox');
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();

  // 「リマインダー送信」ボタンをクリックする
  const sendBtn = await page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  // ダイアログで確認
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('2件の未提出者にリマインダーを送信');
    await dialog.accept();
  });

  // 画面上にリマインダーメール送信処理が実行されたことを示すメッセージが表示されることを待つ
  await page.waitForTimeout(1000);

  // 送信完了後、画面上に「リマインダーメール送信完了」のメッセージが表示されることを確認する
  const successMessage = await page.locator('text=リマインダーを送信しました');
  expect(await successMessage.count()).toBeGreaterThan(0);
});
