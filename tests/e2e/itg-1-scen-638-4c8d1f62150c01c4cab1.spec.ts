import { test, expect, type Page } from '@playwright/test';

// SCEN-638: 日報の報告内容が改行・特殊文字を保持したまま表示される

const REPORT_CONTENT = '本日の業務:\n・システム改修 > DB設計\n・資料作成「進捗報告書」&レビュー';

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報の報告内容が改行・特殊文字を保持したまま表示される', async ({ page }) => {
  await login(page, 'reporter_scen638');

  const textarea = page.locator('#rp-content');
  await textarea.fill(REPORT_CONTENT);
  await expect(textarea).toHaveValue(REPORT_CONTENT);

  await expect(page.locator('#rp-validation')).toHaveText(/入力OK/);
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeEnabled();

  await submitBtn.click();
  await expect(page.locator('#rp-success')).toBeVisible({ timeout: 5000 });

  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const firstRow = page.locator('#rm-r-tbody tr').first();
  await expect(firstRow).toBeVisible();
  await firstRow.locator('button:has-text("詳細")').click();

  const modalBody = page.locator('#rm-view-modal-body');
  await expect(page.locator('#rm-view-modal')).toHaveClass(/is-visible/);

  const bodyHtml = await modalBody.innerHTML();
  const contentDd = modalBody.locator('dd').first();
  const contentText = await contentDd.textContent();

  expect((contentText ?? '').split('\n').length).toBeGreaterThanOrEqual(2);

  expect(contentText ?? '').toContain('「進捗報告書」');
  expect(contentText ?? '').toContain('> DB設計');
  expect(contentText ?? '').toContain('&レビュー');

  expect(bodyHtml).toMatch(/&amp;/);
  expect(bodyHtml).toMatch(/&gt;/);

  expect(bodyHtml).not.toContain('<script');
  expect(contentText ?? '').not.toContain('INVALID');
});
