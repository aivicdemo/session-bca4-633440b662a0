import { test, expect } from '@playwright/test';

// SCEN-677: チームリーダーがリマインダー設定管理画面にアクセスでき、現在の設定内容が表示される

test('チームリーダーがリマインダー設定管理画面にアクセスでき、現在の設定内容が表示される', async ({ page }) => {
  // チームリーダーユーザーでシステムにログインする
  await page.goto('/login.html');
  await page.fill('input[type="text"]', 'tanaka.hanako');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');

  // ログイン後の自動遷移を待つ
  await page.waitForNavigation();

  // 日報確認・管理画面へ遷移する
  await page.goto('/panels/scr-1790147095974.html');

  // 画面内の「リマインダー設定管理」セクション/ボタンにアクセスする
  const settingsBtn = page.locator('#rm-settings-btn');
  await expect(settingsBtn).toBeVisible();
  await settingsBtn.click();

  // リマインダー設定管理画面が表示されるまで待機する
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toHaveClass(/is-visible/);

  // 画面に表示された現在のリマインダー設定内容を確認する
  // 送信時刻入力フィールドが表示されている
  const timeInput = page.locator('#rm-set-time');
  await expect(timeInput).toBeVisible();

  // 送信曜日チェックボックスが表示されている
  const dayCheckboxes = page.locator('.rm-day-checkbox');
  await expect(dayCheckboxes).toHaveCount(7);

  // 送信方法選択フィールドが表示されている
  const methodSelect = page.locator('#rm-set-method');
  await expect(methodSelect).toBeVisible();

  // 設定値の入力フィールド・確認表示が操作可能な状態
  await expect(timeInput).toBeEnabled();
  await expect(methodSelect).toBeEnabled();

  // 「保存」「キャンセル」ボタンが表示されている
  const saveBtn = page.locator('#rm-settings-save');
  const cancelBtn = page.locator('#rm-settings-cancel');
  await expect(saveBtn).toBeVisible();
  await expect(cancelBtn).toBeVisible();
});
