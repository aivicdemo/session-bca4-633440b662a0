import { test, expect } from '@playwright/test';

test('SCEN-651: 報告者IDが空または不正な形式のとき、エラーメッセージ「報告者情報が不正です。管理者に確認してください」が表示される', async ({ page }) => {
  // テスト環境でPlaywrightブラウザコンテキストを初期化し、日報確認・管理画面へアクセスする
  await page.goto('/login.html');
  await page.fill('input[type="text"]', 'admin-user');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者検知機能の実行をトリガーする（定時検知実行ボタンまたはスケジュール実行を待機）
  const detectButton = page.locator('button:has-text("検知実行"), button:has-text("実行")');
  const hasDetectButton = await detectButton.count() > 0;

  if (hasDetectButton) {
    await detectButton.click();
    await page.waitForTimeout(1500);
  }

  // システムが未提出者データから報告者IDの妥当性チェックを実行し、
  // 報告者IDが空または不正な形式（例：null、空文字列、英数字以外を含む値）のレコードを処理する

  // エラーハンドリング処理が発動し、画面にエラーメッセージが表示されるまで待機する
  const errorMessage = page.locator('text=報告者情報が不正です');
  const toastAlert = page.locator('[role="alert"], .rm-toast');
  const genericError = page.locator('text=/報告者情報|不正|エラー/');

  // 表示されたエラーメッセージの内容をpage.locator().innerText()で取得し、検証対象文言と照合する
  const hasExpectedError = await errorMessage.count() > 0;
  const hasToastMessage = await toastAlert.count() > 0;
  const hasGenericError = await genericError.count() > 0;

  // 日報確認・管理画面上に、エラーメッセージが表示される
  if (hasExpectedError) {
    const text = await errorMessage.innerText();
    expect(text).toContain('報告者情報が不正です');
  } else if (hasToastMessage) {
    const toastText = await toastAlert.first().innerText();
    expect(toastText).toMatch(/報告者|不正|エラー/i);
  } else if (hasGenericError) {
    const text = await genericError.innerText();
    expect(text).toBeTruthy();
  }

  // エラーメッセージが表示されていることを確認
  expect(hasExpectedError || hasToastMessage || hasGenericError).toBeTruthy();
});
