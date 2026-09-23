import { test, expect, type Page } from '@playwright/test';

// SCEN-682: リーダーが管理画面でリマインダー送信操作を実行する権限を持つことが確認できる。
//
// panels/scr-1790147095974.html の「選択した未提出者にリマインダーを送信」ボタン（#rm-send-reminder-btn）は
// window.confirm による同期的な確認ダイアログの直後に missing 配列の更新・mailHistory への追加を完了するため、
// 「送信処理中」であることを示す中間状態（スピナー等）は実装されていない。本テストは、ボタンがクリック可能な
// 状態であること・クリック後に成功メッセージ（トースト）が表示されることを検証する。「送信処理中」への遷移に
// ついては .aivic/batches/19/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーロールのユーザーが管理画面でリマインダー送信ボタンを操作でき、成功メッセージが表示される', async ({ page }) => {
  // テスト前提条件: リーダーロールを持つユーザーでログインしていることを確認する
  // （login.html はどの入力値でもログインでき、ロールを区別する実装がないため、ログインできることをもって
  //  リーダーロールでのログイン前提として扱う。詳細は .aivic/batches/19/unresolved.md 参照）
  await login(page, 'leader_scen682');

  // 日報確認・管理画面を開く
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者一覧を表示して、1件以上の未提出者レコードが存在することを確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);

  // 未提出者レコードを1件選択する
  const targetRow = rows.first();
  await targetRow.locator('.rm-missing-checkbox').check();

  // 画面上の「リマインダー送信」ボタンが表示され、クリック可能な状態であることを確認する
  const sendBtn = page.locator('#rm-send-reminder-btn');
  await expect(sendBtn).toBeVisible();
  await expect(sendBtn).toBeEnabled();

  // 「リマインダー送信」ボタンをクリックする
  page.once('dialog', (dialog) => dialog.accept());
  await sendBtn.click();

  // 処理完了後、画面に「リマインダーを送信しました」等の成功メッセージが表示されることを確認する
  const toast = page.locator('#rm-toast');
  await expect(toast).toHaveClass(/is-visible/);
  await expect(toast).toContainText('リマインダーを送信しました');
});
