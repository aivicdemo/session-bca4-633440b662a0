import { test, expect, type Page } from '@playwright/test';

// SCEN-676: リーダーが管理画面にアクセスする権限がない場合、メール送信履歴確認画面へのアクセスが拒否される。
//
// panels/scr-1790147087109.html・panels/scr-1790147095974.html のいずれにも権限判定の実装は存在せず、login.html
// はどの入力値でもログインできる作りである（サンプル実装ではどの入力でもログインできます）。メール送信履歴は
// scr-1790147095974.html 内のタブの一つであり、専用のURLは存在しないため、「日報確認・管理画面のURL（メール
// 送信履歴確認ページ）」は scr-1790147095974.html への直接アクセスとして扱う。ユーザーの役割に関わらずこの
// URLへの直接アクセスは常に HTTP 200 で画面全体を返し、403/401 エラーや「アクセス権限がありません」等の
// メッセージ表示、ログイン画面への自動リダイレクトは実装されていない。これは .aivic/batches/11/unresolved.md の
// SCEN-650 と同種の食い違いであり、本バッチでも .aivic/batches/17/unresolved.md に記録する。本テストは仕様の
// 期待結果の文言どおりに検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('管理画面アクセス権限のないリーダーがメール送信履歴確認画面のURLへ直接アクセスすると403/401で拒否される', async ({
  page,
}) => {
  // テスト用ブラウザセッションを開く。
  // リーダーロール（管理画面アクセス権限なし）でシステムにログインする。
  await login(page, 'leader_no_admin_scen676');

  // ログイン完了後、日報確認・管理画面のURL（メール送信履歴確認ページ）に直接アクセスを試みる。
  const response = await page.goto('/panels/scr-1790147095974.html');

  // サーバーからのレスポンスステータスコードを確認する: HTTP 403（Forbidden）またはHTTP 401（Unauthorized）が
  // 返却され、メール送信履歴確認画面（管理画面）は表示されない。
  expect([401, 403]).toContain(response?.status());

  // 画面に表示される内容を確認する: 「アクセス権限がありません」または「管理者権限が必要です」という
  // エラーメッセージが表示される、もしくはログイン画面へ自動遷移する。
  const deniedMessageVisible = await page
    .getByText(/アクセス権限がありません|管理者権限が必要です|403|Forbidden|401|Unauthorized/)
    .isVisible()
    .catch(() => false);
  const redirectedToLogin = /login\.html/.test(page.url());
  expect(deniedMessageVisible || redirectedToLogin).toBeTruthy();

  // メール送信履歴一覧（管理画面のコンテンツ）が表示されていないことを確認する。
  await expect(page.locator('#rm-mail-tbody')).not.toBeVisible();
});
