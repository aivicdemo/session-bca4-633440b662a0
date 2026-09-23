import { test, expect, type Page } from '@playwright/test';

// SCEN-617: 報告者が送信履歴確認画面を開き、自分の日報に関連するメール送信履歴が表示される。

const REPORT_CONTENT = 'SCEN-617検証用: 本日はテストケースの実施状況を確認した';

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者が送信履歴確認画面を開くと、自分の日報に関連するメール送信履歴が表示される', async ({ page }) => {
  await login(page, 'reporter_scen617');

  // 手順2: 日報を1件入力し、妥当性チェックを経て提出する。
  const textarea = page.locator('#rp-content');
  const validation = page.locator('#rp-validation');
  const submitBtn = page.locator('#rp-submit-btn');

  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();

  await submitBtn.click();

  const success = page.locator('#rp-success');
  await expect(success).toBeVisible({ timeout: 5000 });

  // 手順3: 提出完了後、日報確認・管理画面へ遷移する。
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順4: 日報確認・管理画面のナビゲーション要素（タブ）から「送信履歴確認」機能（メール送信履歴タブ）を開く。
  await page.locator('.rm-tab[data-tab="mail"]').click();

  // 手順5: 送信履歴確認画面が表示されるまで待機する。
  const mailPanel = page.locator('.rm-panel[data-panel="mail"]');
  await expect(mailPanel).toHaveClass(/is-active/);

  // 手順6: 表示された送信履歴一覧の内容を確認する。
  const rows = mailPanel.locator('#rm-mail-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThanOrEqual(1);

  for (let i = 0; i < rowCount; i += 1) {
    const cells = rows.nth(i).locator('td');
    const sentAt = (await cells.nth(0).textContent())?.trim() ?? '';
    const recipient = (await cells.nth(2).textContent())?.trim() ?? '';
    const status = (await cells.nth(4).textContent())?.trim() ?? '';

    // 送信日時が日時形式で表示されている。
    expect(sentAt).toMatch(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/);
    // 送信対象メールアドレスが表示されている（登録ユーザー宛のメールアドレス形式）。
    expect(recipient).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    // 配信状態（成功・失敗・保留中等）が表示されている。
    expect(status).toMatch(/成功|失敗|保留中/);
  }
});
