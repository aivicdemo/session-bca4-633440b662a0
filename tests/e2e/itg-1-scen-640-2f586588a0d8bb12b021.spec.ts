import { test, expect } from '@playwright/test';

test('日報内容が空文字列または null である場合、エラーメッセージが表示される', async ({ page }) => {
  // 日報入力・提出画面を開く
  await page.goto('/panels/scr-1790147087109.html');

  // 日報内容入力欄に空文字列を入力する（または入力せずそのまま）
  const textarea = page.locator('#rp-content');
  await expect(textarea).toHaveValue('');

  // 提出ボタンをクリックする
  const submitBtn = page.locator('#rp-submit-btn');

  // 画面の妥当性チェック結果を確認する
  // 期待結果: 日報内容が空文字列または null であることを理由とするエラーメッセージが表示される
  const validation = page.locator('#rp-validation');

  // 妥当性チェックメッセージが表示されていることを確認
  await expect(validation).toBeVisible();

  // エラーメッセージが表示されていることを確認
  // 「日報内容を入力してください」というメッセージがフォーム上部または入力欄直下に赤字で表示される
  const errorMessage = await validation.textContent();
  expect(errorMessage?.toLowerCase()).toMatch(/入力|空|必須|empty|required/);

  // 提出処理は実行されず、画面は日報入力・提出画面のまま遷移しない
  await expect(submitBtn).toBeDisabled();
  await expect(page.locator('#rp-success')).not.toBeVisible();
  await expect(page).toHaveURL(/scr-1790147087109\.html/);
});
