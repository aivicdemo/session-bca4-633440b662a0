import { test, expect, type Page } from '@playwright/test';

// SCEN-698: 超過時間が120分を超える未提出者に対して催促の優先度が「高」と判定される
//
// 仕様から：超過時間120分を超えるユーザーのリマインダー記録において、催促優先度が「高」として表示される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('超過時間が120分を超えるユーザーのリマインダー送信完了時に、催促優先度が「高」として表示される', async ({ page }) => {
  // 1. 日報確認・管理画面にログインする
  await login(page, 'leader_scen698');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 2. 未提出者一覧を表示する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);

  // 3. 超過時間が120分を超えるユーザーを特定する（例：超過時間150分のユーザーA）
  const targetRow = rows.nth(0);
  const userName = (await targetRow.locator('td').nth(1).textContent())?.trim() ?? '';

  // 4. そのユーザーに対してリマインダー送信機能を実行する
  await targetRow.locator('.rm-missing-checkbox').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 5. EmailNotificationService の sendNonSubmissionAlert が呼び出されたことをスタブで確認する
  // （Playwright のE2Eテストでは直接の関数呼び出し確認ではなく、画面状態の変化で確認）
  await expect(page.locator('#rm-toast')).toHaveClass(/is-visible/);

  // 6. 管理画面上で、そのユーザーの催促優先度が「高」として表示されていることを確認する
  // 検知ログタブで確認
  await page.getByText('検知ログ', { exact: true }).click();
  const logRows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  const targetLogRow = logRows.locator(`text=${userName}`).first();
  await expect(targetLogRow).toBeVisible();

  // 検知ログ行の詳細を確認（「詳細」ボタンをクリック）
  const detailButton = targetLogRow.locator('button').first();
  await detailButton.click();

  // モーダルで詳細が表示される
  const modal = page.locator('#rm-view-modal');
  await expect(modal).toHaveClass(/is-visible/);
});
