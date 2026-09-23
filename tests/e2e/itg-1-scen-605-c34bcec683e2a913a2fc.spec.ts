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
  // 前提: ユーザーマスタに報告者として登録されていないユーザーID「U_NOT_REGISTERED」を用いる。
  await login(page, 'U_NOT_REGISTERED');

  const content = '顧客A社との打ち合わせを実施';
  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  await textarea.fill(content);
  await submitBtn.click({ force: true });

  await expect(
    page.getByText('このユーザーは日報報告者として登録されていません。管理者に確認してください。'),
  ).toBeVisible();
  await expect(page).toHaveURL(/panels\/scr-1790147087109\.html/);
  await expect(textarea).toHaveValue(content);
  await expect(success).not.toBeVisible();
  await expect(page.getByText(/送信失敗|エラー/)).toBeVisible();
});
