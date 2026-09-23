import { test, expect, type Page } from '@playwright/test';

// SCEN-624: チームリーダーが権限を持たない場合、管理画面へのアクセスが拒否される。
//
// 詳細設計（user-authentication-authorization.ts の authenticateAndAuthorizeLeaderAccess、
// InsufficientPermissionError「管理画面へのアクセス権限がありません。」）はリーダー権限判定を規定しているが、
// panels/scr-1790147095974.html・login.html のいずれにも権限判定の実装は存在しない。login.html はどの入力値でも
// ログインでき（フッターにも「サンプル実装ではどの入力でもログインできます」と明記）、ユーザーの役割に関わらず
// 上部ナビゲーションの「管理」リンクが常に表示され、URL直接アクセスでも scr-1790147095974.html がそのまま表示
// される。403 エラーページや「アクセス権限がありません」等のメッセージも実装されていない。
// 本テストは、期待結果を弱めずに仕様の文言どおりの拒否レスポンスを検証する。詳細は unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('チームリーダー権限を持たないユーザーは日報確認・管理画面へアクセスできない', async ({ page }) => {
  // テストブラウザを起動し、日報管理システムにアクセスする
  await page.goto('/');

  // チームリーダー権限を持たないユーザーアカウント（一般報告者）でログインする
  await login(page, 'reporter_scen624');

  // 日報確認・管理画面へのアクセスを試みる（URLに直接アクセス）
  await page.goto('/panels/scr-1790147095974.html');

  // 403 Forbidden エラーページ、または「アクセス権限がありません」というエラーメッセージが表示される
  await expect(page.getByText(/403|Forbidden|アクセス権限がありません/)).toBeVisible();

  // 提出済み日報一覧・未提出者検知・リマインダー設定・ログ確認などの管理機能にはアクセスできない
  await expect(page.locator('#rm-r-tbody')).toHaveCount(0);
  await expect(page.locator('#rm-missing-tbody')).toHaveCount(0);
  await expect(page.locator('#rm-log-tbody')).toHaveCount(0);
  await expect(page.locator('#rm-mail-tbody')).toHaveCount(0);
  await expect(page.locator('#rm-settings-btn')).toHaveCount(0);
  await expect(page.locator('#rm-send-reminder-btn')).toHaveCount(0);

  // ナビゲーションメニューから選択を試行しても同様にアクセスが拒否される
  await page.goto('/panels/scr-1790147087109.html');
  await page.getByText('管理', { exact: true }).click();
  await expect(page.getByText(/403|Forbidden|アクセス権限がありません/)).toBeVisible();

  // ユーザーは日報入力・提出画面のみへアクセス可能な状態に留まる
  await page.goto('/panels/scr-1790147087109.html');
  await expect(page.locator('#rp-content')).toBeVisible();
});
