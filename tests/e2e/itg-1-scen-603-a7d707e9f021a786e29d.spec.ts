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

test('報告内容が最大文字数を超える場合、送信が阻止され入力内容が保持される', async ({ page }) => {
  await login(page, 'reporter_scen603');

  const longText = 'あ'.repeat(1001); // 画面の MAX_LEN = 1000 を超える
  const textarea = page.locator('#rp-content');
  const validation = page.locator('#rp-validation');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  await textarea.fill(longText);
  // 1000文字を超えているので送信ボタンは無効化されている
  expect(await submitBtn.isDisabled()).toBeTruthy();
  // バリデーションメッセージに「超えています」が含まれることを確認
  const validationText = await validation.textContent();
  expect(validationText).toContain('超えています');
  expect(await textarea).toHaveValue(longText);
  await expect(success).not.toBeVisible();
  await expect(page).toHaveURL(/panels\/scr-1790147087109\.html/);
});
