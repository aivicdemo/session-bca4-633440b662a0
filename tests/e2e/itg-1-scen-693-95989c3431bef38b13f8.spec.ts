import { test, expect, type Page } from '@playwright/test';

// SCEN-693: メール送信サーバーへの接続に失敗した場合、失敗がログに記録されて管理画面に
// 「通知送信失敗」が表示される。
//
// panels/scr-1790147095974.html の #rm-send-reminder-btn のクリックハンドラは、選択された未提出者の
// lastReminder を無条件に現在時刻へ書き換え、mailHistory に status「成功」の履歴を追加するだけの
// クライアント側処理であり、実際のメール送信サーバーへの通信は一切行わない（fetch 等の通信呼び出しは
// 存在しない）。このため「メール送信サーバーへの接続に失敗する」状況を再現する手段が画面上に存在しない。
// また missing 配列・mailHistory 配列はいずれも AIVIC_PAGE_INIT_JS 内のローカル変数であり、
// window.AIVIC_API_URL 経由での永続化は行われないため、画面をリロードするとハードコードされた初期値
// （未提出者3件、いずれも lastReminder は「未送信」または固定の送信日時）に戻ってしまい、送信結果は
// 保持されない。未提出者一覧（#rm-missing-tbody）にも「通知送信失敗」という文言・フラグを表示する列は
// 実装されていない。この食い違いは .aivic/batches/20/unresolved.md に記録する。本テストは、仕様の
// 手順・期待結果の文言をそのまま検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('メール送信サーバーへの接続に失敗した場合、未提出者一覧に「通知送信失敗」が表示される', async ({ page }) => {
  // 手順1: 日報確認・管理画面にログイン
  await login(page, 'leader_scen693');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 手順2: 未提出者一覧から1名以上の報告者を確認
  const targetRow = page.locator('#rm-missing-tbody tr', { hasText: '高橋 次郎' });
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-missing-checkbox').check();

  // 手順3: リマインダー送信ボタンをクリック
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 手順4: メール送信サーバーへの接続に失敗するまで待機
  // 手順5: リマインダー送信処理が完了するまで待機
  await page.waitForLoadState('networkidle');

  // 手順6: 日報確認・管理画面をリロード
  await page.reload();
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 期待結果: 未提出者一覧に対象報告者の行に「通知送信失敗」が表示される
  await expect(page.locator('#rm-missing-tbody tr', { hasText: '高橋 次郎' }).getByText('通知送信失敗')).toBeVisible();
});
