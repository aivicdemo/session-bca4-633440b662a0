import { test, expect, type Page } from '@playwright/test';

// SCEN-637: 日報の提出時刻が『HH:MM』形式で表示される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報の提出時刻が『HH:MM』形式で表示される', async ({ page }) => {
  await login(page, 'reporter_scen637');

  const textarea = page.locator('#rp-content');
  await textarea.fill('本日の業務内容：システム要件書の作成を実施し、顧客へ提出しました。');

  await expect(page.locator('#rp-validation')).toHaveClass(/is-ok/);
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  await expect(page.locator('#rp-success')).toBeVisible();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  await page.locator('#rm-r-tbody tr').first().locator('button:has-text("詳細")').click();
  await expect(page.locator('#rm-view-modal')).toHaveClass(/is-visible/);

  const submittedAtText = await page.locator('#rm-view-modal-body').innerText();
  expect(submittedAtText).toMatch(/\d{2}:\d{2}/);
});
