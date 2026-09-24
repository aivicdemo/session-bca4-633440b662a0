import { test, expect, type Page } from '@playwright/test';

// SCEN-639: 日報が定時（17:00）以降に提出された場合、遅延フラグが表示される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報が定時（17:00）以降に提出された場合、遅延フラグが表示される', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-23T17:30:00') });

  await login(page, 'reporter_scen639');

  const textarea = page.locator('#rp-content');
  await textarea.fill('本日は17:30以降の遅延提出テストです。システム設定の確認と最終チェックを完了しました。');
  await expect(page.locator('#rp-submit-btn')).toBeEnabled();

  await page.locator('#rp-submit-btn').click();
  await expect(page.locator('#rp-success')).toBeVisible({ timeout: 5000 });

  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const reportRows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  const lateSubmissionRow = reportRows.filter({ has: page.locator('td:nth-child(4)', { hasText: /19:03/ }) }).first();
  await expect(lateSubmissionRow).toBeVisible();

  const rowHtml = await lateSubmissionRow.innerHTML();
  expect(rowHtml).toMatch(/遅延/);
});
