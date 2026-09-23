import { test, expect, type Page } from '@playwright/test';

// SCEN-650: リーダーに管理画面アクセス権限がないとき、管理画面へのアクセスが拒否される。
//
// panels/scr-1790147087109.html・panels/scr-1790147095974.html のいずれにも権限判定の実装は存在せず、login.html
// はどの入力値でもログインできる作りである。ユーザーの役割に関わらず上部ナビゲーションの「管理」リンクは常に
// 表示され、URL直接アクセスでも scr-1790147095974.html がそのまま表示される。403 エラーページや「この画面に
// アクセスする権限がありません」等のメッセージ、日報入力・提出画面へのリダイレクトも実装されていない
// （user-authentication-authorization.ts の InsufficientPermissionError「管理画面へのアクセス権限がありません。」
// に対応する画面側の実装はない）。これは .aivic/batches/5/unresolved.md の SCEN-624 と同種の食い違いであり、
// 本バッチでも .aivic/batches/11/unresolved.md に記録する。本テストは仕様の期待結果の文言どおりに検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('管理画面アクセス権限のないリーダーはURL直接入力・ナビゲーションのいずれでもアクセスが拒否される', async ({
  page,
}) => {
  // テスト用ユーザー（リーダー権限、管理画面アクセス権限なし）でログインする。
  await login(page, 'leader_no_admin_scen650');

  // ログイン後、日報確認・管理画面へのアクセスURLを直接入力する。
  await page.goto('/panels/scr-1790147095974.html');

  // システムからのレスポンスを確認する: HTTP 403（Forbidden）エラーまたはアクセス権限不足を示す画面が表示される。
  await expect(page.getByText(/403|Forbidden|この画面にアクセスする権限がありません/)).toBeVisible();

  // ユーザーは日報入力・提出画面へリダイレクトされるか、エラーメッセージが表示される。
  await page.waitForURL(/panels\/scr-1790147087109\.html/);

  // ナビゲーションメニューから遷移を試みても同様にアクセスが拒否される。
  await page.goto('/panels/scr-1790147087109.html');
  await page.getByText('管理', { exact: true }).click();
  await expect(page.getByText(/403|Forbidden|この画面にアクセスする権限がありません/)).toBeVisible();
});
