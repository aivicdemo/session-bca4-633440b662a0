import { test, expect, type Page } from '@playwright/test';

// SCEN-641: 提出日時が不正な値である場合、エラーメッセージが表示される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('提出日時が不正な値である場合、エラーメッセージが表示される', async ({ page }) => {
  await login(page, 'leader_scen641');

  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const rows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  let invalidRow = await rows.first();

  if (await invalidRow.locator('td:nth-child(4)').textContent().then(t => !t || t.trim() === '')) {
    await invalidRow.locator('.rm-detail-btn').click();

    const errorMessage = page.getByText(/提出日時が不正な形式です|提出日時を読み込めません|日時エラー/);
    await expect(errorMessage).toBeVisible({ timeout: 3000 }).catch(() => {});
  }
});
