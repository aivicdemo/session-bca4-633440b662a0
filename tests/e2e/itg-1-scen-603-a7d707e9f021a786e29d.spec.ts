import { test, expect, type Page } from '@playwright/test';

// SCEN-603: 報告内容が500文字を超える場合、送信が阻止されエラーメッセージ
// 「報告内容は500文字以内で入力してください」が表示され、入力内容は保持される
// （daily-report-submission#validateDailyReportContentQuality の DailyReportContentExceedsMaxLengthException 系）。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告内容が500文字を超える場合、送信が阻止され入力内容が保持される', async ({ page }) => {
  await login(page, 'reporter_scen603');

  const longText = 'あ'.repeat(501);
  const textarea = page.locator('#rp-content');
  const validation = page.locator('#rp-validation');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  await textarea.fill(longText);
  await submitBtn.click({ force: true });

  await expect(validation).toHaveText('報告内容は500文字以内で入力してください');
  await expect(textarea).toHaveValue(longText);
  await expect(success).not.toBeVisible();
  await expect(page).toHaveURL(/panels\/scr-1790147087109\.html/);
});
