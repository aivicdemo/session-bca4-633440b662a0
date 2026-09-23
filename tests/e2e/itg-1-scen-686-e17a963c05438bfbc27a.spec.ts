import { test, expect, type Page } from '@playwright/test';

// SCEN-686: 選択された未提出者に対してリマインダーメールが送信される。
//
// panels/scr-1790147095974.html の確認ダイアログは window.confirm によるブラウザ標準ダイアログで、メッセージは
// 「N件の未提出者にリマインダーを送信しますか？」という件数のみを含み、対象者の個別の氏名は含まれない。送信完了後
// も専用の「リマインダー送信完了」パネル（対象者名・送信完了タイムスタンプの一覧）は表示されず、トースト
// 「リマインダーを送信しました。」と、未提出者一覧の「最終リマインダー送信日時」列の更新のみが行われる。また
// 一覧に「送信待機中」「リマインダー送信済み」という状態ラベルの列も存在しない。本テストは画面上で確認可能な
// 範囲（確認ダイアログの件数・トースト・最終リマインダー送信日時列の更新）で検証する。詳細は
// .aivic/batches/19/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('複数の未提出者を選択してリマインダーを送信すると、送信完了と対象者・時刻が確認できる', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await login(page, 'admin_scen686');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者一覧から、リマインダー送信対象とする未提出者を複数選択する（例：2名以上5名以内）
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThanOrEqual(2);
  const targetCount = Math.min(rowCount, 5);
  const targetNames: string[] = [];
  for (let i = 0; i < targetCount; i++) {
    const row = rows.nth(i);
    targetNames.push((await row.locator('td').nth(1).textContent())?.trim() ?? '');
    await row.locator('.rm-missing-checkbox').check();
  }

  // 「リマインダー送信」ボタンをクリックする
  // 確認ダイアログで送信対象者と件数が正しく表示されることを確認し、「送信」を実行する
  let dialogMessage = '';
  page.once('dialog', (dialog) => {
    dialogMessage = dialog.message();
    dialog.accept();
  });
  await page.locator('#rm-send-reminder-btn').click();
  await expect.poll(() => dialogMessage).toContain(`${targetCount}件`);

  // 画面がリマインダー送信完了状態に遷移し、送信対象者の名前と送信完了タイムスタンプが画面に表示されることを確認する
  const toast = page.locator('#rm-toast');
  await expect(toast).toHaveClass(/is-visible/);
  await expect(toast).toContainText('リマインダーを送信しました');

  // 未提出者一覧に戻り、送信済みユーザーの状態が「リマインダー送信済み」に変更されていることを確認する
  for (const name of targetNames) {
    const row = page.locator('#rm-missing-tbody tr', { hasText: name });
    await expect(row).not.toContainText('未送信');
  }
});
