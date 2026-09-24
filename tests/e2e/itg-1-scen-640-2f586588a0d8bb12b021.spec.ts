import { test, expect, type Page } from '@playwright/test';

// SCEN-640: 日報内容が空文字列または null である場合、エラーメッセージが表示される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報内容が空文字列である場合、エラーメッセージが表示される', async ({ page }) => {
  await login(page, 'reporter_scen640');

  const textarea = page.locator('#rp-content');
  await expect(textarea).toHaveValue('');

  const validation = page.locator('#rp-validation');
  await expect(validation).toContainText('入力してください');

  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeDisabled();

  await expect(page.locator('#rp-success')).not.toBeVisible();
  await expect(page).toHaveURL(/scr-1790147087109\.html/);
});
