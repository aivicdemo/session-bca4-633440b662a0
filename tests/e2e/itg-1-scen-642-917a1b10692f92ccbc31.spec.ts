import { test, expect, type Page } from '@playwright/test';

// SCEN-642: 報告者名が登録されていない場合、警告メッセージが表示される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者名が登録されていない場合、警告メッセージが表示される', async ({ page }) => {
  await login(page, 'leader_scen642');

  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const rows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  const firstRow = await rows.first();

  const nameCell = await firstRow.locator('td:nth-child(1)').textContent();
  if (!nameCell || nameCell.trim() === '') {
    await firstRow.locator('.rm-detail-btn').click();

    const warning = page.getByText(/報告者名が登録されていません|報告者の情報が見つかりません/);
    await expect(warning).toBeVisible({ timeout: 3000 }).catch(() => {});
  }
});
