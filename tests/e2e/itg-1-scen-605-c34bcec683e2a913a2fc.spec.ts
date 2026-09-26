import { test, expect, type Page } from '@playwright/test';

// SCEN-605: 報告者マスタに登録されていないユーザーが送信すると、送信ボタン押下時に
// 「このユーザーは日報報告者として登録されていません。管理者に確認してください。」が表示され、
// 入力画面に留まり入力内容も保持される（user-authentication-authorization#authenticateAndAuthorizeReporterAccess
// の UserNotRegisteredAsReporterException に対応）。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者マスタに未登録のユーザーは日報送信がエラーとなる', async ({ page }) => {
  // 前提: ユーザーマスタに報告者として登録されていないユーザーを用いる
  await login(page, 'user_not_registered');

  const content = '顧客A社との打ち合わせを実施';
  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  await textarea.fill(content);

  // 送信ボタンをクリック
  await submitBtn.click();

  // エラーメッセージが表示される
  await expect(
    page.locator('text=このユーザーは日報報告者として登録されていません。管理者に確認してください。'),
  ).toBeVisible();

  // 入力画面に留まっている
  await expect(page).toHaveURL(/panels\/scr-1790147087109\.html/);

  // 入力内容が保持されている
  await expect(textarea).toHaveValue(content);

  // 成功メッセージは表示されない
  await expect(success).not.toBeVisible();

  // 画面下部にエラー状態が表示されている
  await expect(page.locator('text=/送信失敗|エラー/')).toBeVisible();
});
