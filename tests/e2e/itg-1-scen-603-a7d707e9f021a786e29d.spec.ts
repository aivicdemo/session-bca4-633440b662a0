import { test, expect, type Page } from '@playwright/test';

// SCEN-603: 報告内容が500文字を超える場合、送信が阻止されエラーメッセージ
// 「報告内容は500文字以内で入力してください」が表示され、入力内容は保持される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告内容が500文字を超える場合、送信が阻止され入力内容が保持される', async ({ page }) => {
  await login(page, 'reporter_scen603');

  const longText = 'あ'.repeat(501); // 500文字を超える
  const textarea = page.locator('#rp-content');
  const validation = page.locator('#rp-validation');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  await textarea.fill(longText);

  // 送信ボタンをクリック
  await submitBtn.click({ force: true });

  // エラーメッセージが表示される
  await expect(validation).toContainText('報告内容は500文字以内で入力してください');

  // 入力内容が保持されている
  await expect(textarea).toHaveValue(longText);

  // 成功メッセージは表示されない
  await expect(success).not.toBeVisible();

  // 画面は入力画面のままである
  await expect(page).toHaveURL(/panels\/scr-1790147087109\.html/);
});
