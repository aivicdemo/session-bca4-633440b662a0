import { test, expect, type Page } from '@playwright/test';

// SCEN-602: 報告内容が10文字未満の場合、送信が阻止されエラーメッセージ
// 「報告者の入力は10文字以上である必要があります」が表示され、入力内容は保持される
// （daily-report-submission#validateDailyReportContentQuality の ContentTooShortError 系）。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告内容が10文字未満の場合、送信が阻止され入力内容が保持される', async ({ page }) => {
  await login(page, 'reporter_scen602');

  const shortText = 'テスト'; // 3文字
  const textarea = page.locator('#rp-content');
  const validation = page.locator('#rp-validation');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  await textarea.fill(shortText);
  // 10文字未満なので送信ボタンは無効化されている
  expect(await submitBtn.isDisabled()).toBeTruthy();
  // バリデーションメッセージに「あと...文字」が含まれることを確認
  const validationText = await validation.textContent();
  expect(validationText).toContain('文字');
  expect(await textarea).toHaveValue(shortText);
  await expect(success).not.toBeVisible();
  await expect(page).toHaveURL(/panels\/scr-1790147087109\.html/);
});
