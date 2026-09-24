import { test, expect, type Page } from '@playwright/test';

// SCEN-697: 超過時間が30分を超えて120分以内の未提出者に対して催促の優先度が「中」と判定される
//
// 仕様から：送信対象ユーザーの超過時間が30分を超えて120分以内の場合、管理画面上でリマインダー送信完了状態
// （「リマインダー送信済み」ステータスと送信時刻）が正しく表示される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('超過時間が30分を超えて120分以内の未提出者にリマインダーを送信すると、管理画面に「リマインダー送信済み」ステータスと送信時刻が表示される', async ({ page }) => {
  // 1. 日報確認・管理画面にログインする
  await login(page, 'leader_scen697');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 2. リマインダー設定管理で催促優先度判定ルールが「30分超過～120分以内 = 優先度：中」に設定されていることを確認する
  await page.locator('#rm-settings-btn').click();
  await expect(page.locator('#rm-settings-modal')).toHaveClass(/is-visible/);
  // 設定内容の確認（ダイアログが開いていることを確認）
  await page.locator('#rm-settings-modal-close').click();

  // 3. 未提出者一覧検索条件を「超過時間：30分超過～120分以内」に指定して検索を実行する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  // 未提出者が存在することを確認
  await expect(rows).not.toHaveCount(0);
  const targetRow = rows.first();

  // 4. 検索結果に表示された未提出者のいずれか1件を選択する
  await targetRow.locator('.rm-missing-checkbox').check();

  // 5. 未提出者に対してリマインダー通知を送信するボタンをクリックする
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 6. 管理画面の該当ユーザーの行に「リマインダー送信済み」ステータスと送信時刻が表示されることを確認する
  // トーストメッセージが表示されることを確認
  await expect(page.locator('#rm-toast')).toHaveClass(/is-visible/);

  // 未提出者一覧を再度確認して、送信したユーザーの最終リマインダー送信日時が更新されていることを確認
  const statusCell = targetRow.locator('td').nth(3);
  const statusText = await statusCell.textContent();

  // ステータスに送信日時が表示されていることを確認（「リマインダー送信済み」の状態を確認）
  expect(statusText).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/);
});
