import { test, expect, type Page } from '@playwright/test';

// SCEN-640: 日報内容が空文字列または null である場合、エラーメッセージが表示される
//
// panels/scr-1790147087109.html の #rp-validation は、報告内容が空（0文字）の場合に
// 「10文字以上1000文字以内で入力してください」という文言を表示し、文字色は var(--text)（既定の文字色）で、
// 「赤字」を示すクラス（is-error）も付与しない実装になっている。仕様が期待する文言「日報内容を入力してください」
// および赤字表示とは一致しない。本テストは、仕様の期待結果を弱めずにそのまま検証する。詳細は unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報内容が空文字列である場合、エラーメッセージが表示される', async ({ page }) => {
  // 手順1: 日報入力・提出画面を開く
  await login(page, 'reporter_scen640');

  // 手順2: 日報内容入力欄に空文字列を入力する（または入力せずそのまま）
  const textarea = page.locator('#rp-content');
  await expect(textarea).toHaveValue('');

  // 手順3: 提出ボタンをクリックする
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeDisabled();
  await submitBtn.click({ force: true }).catch(() => {});

  // 手順4: 画面の妥当性チェック結果を確認する
  // 期待結果: 「日報内容を入力してください」というメッセージがフォーム上部または入力欄直下に赤字で表示され、
  // 提出処理は実行されず、画面は日報入力・提出画面のまま遷移しない。
  const validation = page.locator('#rp-validation');
  await expect(validation).toBeVisible();
  await expect(validation).toHaveText('日報内容を入力してください');
  await expect(validation).toHaveCSS('color', 'rgb(211, 47, 47)');

  await expect(page.locator('#rp-success')).not.toBeVisible();
  await expect(page).toHaveURL(/scr-1790147087109\.html/);
});
