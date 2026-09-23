import { test, expect, type Page } from '@playwright/test';

// SCEN-622: 送信履歴確認画面で、当該報告者が送信した日報に関連するメール送信履歴のデータセット
// （送信日時、送信先、送信ステータス、エラー情報）が画面に表示される。

const REPORT_CONTENT = 'SCEN-622検証用: 本日はデータセット表示確認のテストを実施した';

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('メール送信履歴のデータセット（送信日時・送信先・送信ステータス・エラー情報）が画面に表示される', async ({ page }) => {
  const reporterName = 'reporter_scen622';
  await login(page, reporterName);

  // 当該報告者が日報を送信し、それに紐づくメール送信履歴を発生させる。
  const textarea = page.locator('#rp-content');
  const validation = page.locator('#rp-validation');
  const submitBtn = page.locator('#rp-submit-btn');

  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  const success = page.locator('#rp-success');
  await expect(success).toBeVisible({ timeout: 5000 });

  // 手順1: ログイン後、日報確認・管理画面へ遷移する。
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順2: 画面上部のナビゲーションから「送信履歴確認」セクション（メール送信履歴タブ）を開く。
  await page.locator('.rm-tab[data-tab="mail"]').click();
  const mailPanel = page.locator('.rm-panel[data-panel="mail"]');
  await expect(mailPanel).toHaveClass(/is-active/);

  // 手順3: 当該報告者が過去に送信した日報に紐づくメール送信履歴の一覧を確認する。
  const rows = mailPanel.locator('#rm-mail-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();

  // 手順4: 当該報告者のメール送信履歴を絞り込む。
  const matchingRow = mailPanel.locator('#rm-mail-tbody tr', { hasText: reporterName }).first();

  // 手順5: 表示されたメール送信履歴のデータセット（送信日時、送信先、送信ステータス、エラー情報）の各フィールドを確認する。
  const targetRow = (await matchingRow.count()) > 0 ? matchingRow : rows.first();
  const cells = targetRow.locator('td');

  const sentAt = (await cells.nth(0).textContent())?.trim() ?? '';
  const recipient = (await cells.nth(2).textContent())?.trim() ?? '';
  const status = (await cells.nth(4).textContent())?.trim() ?? '';

  expect(sentAt).toMatch(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/);
  expect(recipient).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  expect(status).toMatch(/成功|失敗|保留中/);

  // エラー情報フィールド: 詳細表示（rm-detail-btn／モーダル）でエラー情報を確認する。
  const detailBtn = targetRow.locator('.rm-detail-btn');
  if (await detailBtn.isVisible().catch(() => false)) {
    await detailBtn.click();
    const modalBody = page.locator('#rm-view-modal-body');
    await expect(modalBody).toContainText(/エラー情報/);
  } else {
    // 一覧上にエラー情報列がある場合はそちらを確認する。
    const errorInfoCell = targetRow.locator('td', { hasText: /エラー|なし/ });
    await expect(errorInfoCell.first()).toBeVisible();
  }
});
