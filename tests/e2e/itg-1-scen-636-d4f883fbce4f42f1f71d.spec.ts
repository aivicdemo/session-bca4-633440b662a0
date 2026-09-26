import { test, expect, type Page } from '@playwright/test';

// SCEN-636: 日報が報告者の氏名を表示される
// 日報詳細画面の報告者情報欄に、提出したテストユーザーの氏名が正確に表示される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報が報告者の氏名を表示される', async ({ page }) => {
  const reporterName = 'テスト太郎';

  await login(page, reporterName);

  const textarea = page.locator('#rp-content');
  await textarea.fill('本日の業務内容：システム改修タスクの実装を進め、単体テストを完了しました。');

  await expect(page.locator('#rp-validation')).toHaveClass(/is-ok/);
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  await expect(page.locator('#rp-success')).toBeVisible();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  await page.locator('#rm-r-tbody tr').first().locator('button:has-text("詳細")').click();
  await expect(page.locator('#rm-view-modal')).toHaveClass(/is-visible/);

  const modalTitle = page.locator('#rm-view-modal-title');
  await expect(modalTitle).toContainText(reporterName);
});
