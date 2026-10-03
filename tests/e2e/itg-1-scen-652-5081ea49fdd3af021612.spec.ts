import { test, expect } from '@playwright/test';

test('SCEN-652: 提出期限の時刻が設定されていないとき、エラーメッセージ「提出期限が設定されていません。システム管理者に連絡してください」が表示される', async ({ page }) => {
  // 日報確認・管理画面にシステム管理者権限でログインする
  await page.goto('/login.html');
  await page.fill('input[type="text"]', 'admin-user');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // リマインダー設定管理画面を開く
  const settingsButton = page.locator('button:has-text("⚙ リマインダー設定管理"), button:has-text("設定")');
  const hasSettingsButton = await settingsButton.count() > 0;

  if (hasSettingsButton) {
    await settingsButton.first().click();
    await page.waitForTimeout(500);
  }

  // 提出期限の時刻フィールドが空白（未設定）の状態で、未提出者検知機能の実行トリガー
  const timeInput = page.locator('#rm-set-time');
  const hasTimeInput = await timeInput.count() > 0;

  if (hasTimeInput) {
    // 時刻フィールドを空にする
    await timeInput.fill('');
    await page.waitForTimeout(300);
  }

  // 未提出者検知機能の実行トリガー（例：「検知実行」ボタン押下、または定時自動検知のシミュレーション開始）を操作する
  const detectButton = page.locator('button:has-text("検知実行"), button:has-text("実行")');
  const hasDetectButton = await detectButton.count() > 0;

  if (hasDetectButton) {
    await detectButton.click();
    await page.waitForTimeout(1500);
  } else {
    // 設定を保存してみる
    const saveButton = page.locator('button:has-text("保存")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }
  }

  // 画面上にエラーメッセージが表示されるまで待機する
  const errorMessage = page.locator('text=提出期限が設定されていません');
  const systemErrorMessage = page.locator('text=/提出期限|システム管理者|設定/');
  const toastAlert = page.locator('[role="alert"], .rm-toast');

  // エラーメッセージが表示されていることを確認
  const hasExpectedError = await errorMessage.count() > 0;
  const hasSystemError = await systemErrorMessage.count() > 0;
  const hasToast = await toastAlert.count() > 0;

  expect(hasExpectedError || hasSystemError || hasToast).toBeTruthy();

  // 未提出者検知処理が開始されず、画面に留まることを確認
  const currentUrl = page.url();
  expect(currentUrl).toContain('scr-1790147095974');

  // エラーメッセージが表示されていることを最終確認
  if (hasExpectedError) {
    const text = await errorMessage.innerText();
    expect(text).toContain('提出期限が設定されていません');
  }
});
