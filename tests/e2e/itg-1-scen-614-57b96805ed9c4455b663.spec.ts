import { test, expect, type Page } from '@playwright/test';

// SCEN-614: 日報送信時刻がシステムに自動記録され、送信完了判定が行われる。

const REPORT_CONTENT = 'SCEN-614検証用: 今日の業務内容を記録するテストケース';

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報送信時刻が記録され、送信完了と判定される', async ({ page }) => {
  await login(page, 'reporter_scen614');

  // 手順1: 送信基準時刻を記録する。
  const submissionBaseTime = Date.now();

  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const validation = page.locator('#rp-validation');

  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();

  await submitBtn.click();

  // 手順5: 送信完了メッセージが表示されるまで待機する。
  const success = page.locator('#rp-success');
  await expect(success).toBeVisible({ timeout: 5000 });

  // 手順6: 完了表示時刻を記録する。
  const completionDisplayTime = Date.now();

  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  await page.locator('#rm-r-keyword').fill(REPORT_CONTENT);

  const matchingRow = page.locator('#rm-r-tbody tr', { hasText: REPORT_CONTENT });
  await expect(matchingRow).toHaveCount(1);

  // 手順9・10: 送信時刻とステータスを確認する。
  const timestampCell = matchingRow.locator('td').nth(3);
  const timestampText = await timestampCell.textContent();
  const recordedTime = timestampText ? Date.parse(timestampText.trim().replace(' ', 'T')) : NaN;

  expect(recordedTime).toBeGreaterThanOrEqual(submissionBaseTime);
  expect(recordedTime).toBeLessThanOrEqual(completionDisplayTime);

  await expect(matchingRow).toContainText('送信完了');
});
