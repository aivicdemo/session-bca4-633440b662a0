import { test, expect, type Page } from '@playwright/test';

// SCEN-687: リマインダー送信後の未提出者検知結果が更新されて管理画面に反映される。
//
// panels/scr-1790147095974.html の「検知ログ」タブ（#rm-log-tbody）は window.AIVIC_PAGE_INIT_JS 内にハードコード
// された固定の logs 配列を表示するのみで、「未提出者・リマインダー」タブでのリマインダー送信操作とは連動しない
// （送信してもリロード後も検知ログの内容・検知日時は変化しない）。また「ユーザーが日報を新たに提出した場合は
// 未提出者リストから消える」という連動も、missing 配列が日報テーブルの実データと連動していないため再現できない。
// 画面上で送信操作と連動して更新される唯一の項目は、未提出者一覧の「最終リマインダー送信日時」列である。本テスト
// は仕様の期待結果の文言に従い検知ログの更新も確認するが、上記の理由で成立しない可能性が高い。詳細は
// .aivic/batches/19/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リマインダー送信後、管理画面の未提出者検知結果が更新される', async ({ page }) => {
  // 1. 管理者ユーザーで日報確認・管理画面にログインする
  await login(page, 'admin_scen687');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 2. 管理画面の未提出者一覧を確認し、現在の未提出者リストを記録する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);
  const targetRow = rows.first();
  const targetName = (await targetRow.locator('td').nth(1).textContent())?.trim() ?? '';

  // 送信前の検知ログの状態（リマインダー送信済みフラグ・最終検知時刻）を記録する
  await page.getByText('検知ログ', { exact: true }).click();
  const logRowBefore = page.locator('#rm-log-tbody tr', { hasText: targetName });
  const detectedAtBefore = await logRowBefore.locator('td').nth(2).textContent();

  // 3. 未提出者一覧上のリマインダー送信ボタンをクリックする
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  await targetRow.locator('.rm-missing-checkbox').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 4. リマインダー送信処理が完了するまで待機する
  await expect(page.locator('#rm-toast')).toHaveClass(/is-visible/);

  // 5. 管理画面を自動更新するか、ブラウザをリロードして未提出者一覧を再表示する
  await page.reload();

  // 6. 未提出者一覧の検知結果（ユーザーの提出状態、『通知送信済み』フラグ、最終検知時刻）が
  //    更新されていることを確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const updatedRow = page.locator('#rm-missing-tbody tr', { hasText: targetName });
  await expect(updatedRow).not.toContainText('未送信');

  await page.getByText('検知ログ', { exact: true }).click();
  const logRowAfter = page.locator('#rm-log-tbody tr', { hasText: targetName });
  const detectedAtAfter = await logRowAfter.locator('td').nth(2).textContent();
  expect(detectedAtAfter).not.toBe(detectedAtBefore);
});
