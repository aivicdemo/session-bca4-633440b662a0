import { test, expect } from '@playwright/test';

// SCEN-678: リマインダー設定の送信時刻・送信曜日・送信方法を変更し、保存すると設定が反映される

test('リマインダー設定の送信時刻・送信曜日・送信方法を変更し、保存すると設定が反映される', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('/login.html');
  await page.fill('input[type="text"]', 'tanaka.hanako');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.waitForNavigation();

  // リマインダー設定管理セクションを開く
  await page.goto('/panels/scr-1790147095974.html');
  const settingsBtn = page.locator('#rm-settings-btn');
  await expect(settingsBtn).toBeVisible();
  await settingsBtn.click();

  // モーダルが表示されるまで待機
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toHaveClass(/is-visible/);

  // 現在のリマインダー設定を確認する
  const timeInput = page.locator('#rm-set-time');
  const methodSelect = page.locator('#rm-set-method');

  // 送信時刻を変更する（例：9:00 → 10:30）
  await timeInput.fill('10:30');

  // 送信曜日を変更する（例：月〜金 → 月・水・金）
  // すべての曜日チェックボックスをまずチェック解除
  const dayCheckboxes = page.locator('.rm-day-checkbox');
  for (let i = 0; i < 7; i++) {
    await dayCheckboxes.nth(i).uncheck({ force: true });
  }

  // 月（index 0）、水（index 2）、金（index 4）をチェック
  await dayCheckboxes.nth(0).check({ force: true });
  await dayCheckboxes.nth(2).check({ force: true });
  await dayCheckboxes.nth(4).check({ force: true });

  // 送信方法を変更する（例：メール → アプリ通知など）
  await methodSelect.selectOption('アプリ通知');

  // 「保存」ボタンをクリックする
  const saveBtn = page.locator('#rm-settings-save');
  await saveBtn.click();

  // 保存完了メッセージが画面に表示されるまで待機する
  const toast = page.locator('.rm-toast.is-visible');
  await expect(toast).toBeVisible();

  // ページを再読み込みするか、設定管理画面を一度閉じて再度開く
  await page.reload();
  await page.waitForLoadState('networkidle');

  // リマインダー設定管理セクションで現在の設定値を確認する
  await settingsBtn.click();
  await expect(settingsModal).toHaveClass(/is-visible/);

  // 変更後の値が反映されていることを確認
  const newTimeValue = await timeInput.inputValue();
  expect(newTimeValue).toBe('10:30');

  const newMethodValue = await methodSelect.inputValue();
  expect(newMethodValue).toBe('アプリ通知');

  // 送信曜日の確認
  const updatedCheckboxes = page.locator('.rm-day-checkbox');
  expect(await updatedCheckboxes.nth(0).isChecked()).toBe(true);  // 月
  expect(await updatedCheckboxes.nth(1).isChecked()).toBe(false); // 火
  expect(await updatedCheckboxes.nth(2).isChecked()).toBe(true);  // 水
  expect(await updatedCheckboxes.nth(3).isChecked()).toBe(false); // 木
  expect(await updatedCheckboxes.nth(4).isChecked()).toBe(true);  // 金
});
