import { test, expect, type Page } from '@playwright/test';

// SCEN-671: 提出期限の時刻形式が不正な場合、検知ログ画面に「提出期限は24時間形式（HH:MM）で設定してください」エラーメッセージが表示される

test('提出期限の時刻形式が不正な場合、エラーメッセージが表示される', async ({ page }) => {
  // 手順1: テストユーザーで日報確認・管理画面にログインする
  await page.goto('/panels/scr-1790147095974.html');

  // 手順2: リマインダー設定管理セクションにアクセスする
  const settingsBtn = page.locator('#rm-settings-btn');
  await settingsBtn.click();

  // リマインダー設定モーダルが表示される
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toHaveClass(/is-visible/);

  // 手順3: 提出期限の時刻入力フィールドに不正な形式を入力
  const timeInput = page.locator('#rm-set-time');

  // 不正な形式の例：「25:70」（24時間形式以外）
  await timeInput.fill('25:70');

  // 手順4: 設定を保存する
  const saveBtn = page.locator('#rm-settings-save');
  await saveBtn.click();

  // 手順5-6: 検知ログ画面に遷移し、エラーメッセージを確認

  // 期待結果: エラーメッセージが表示される
  // 「提出期限は24時間形式（HH:MM）で設定してください」
  const errorMessage = page.locator('text=提出期限は24時間形式（HH:MM）で設定してください');

  // エラーメッセージが存在することを確認
  await expect(errorMessage).toBeVisible({ timeout: 3000 });

  // エラーメッセージは日本語で明確に表示されていることを確認
  const errorText = await errorMessage.textContent();
  expect(errorText).toBe('提出期限は24時間形式（HH:MM）で設定してください');
});
