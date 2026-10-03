import { test, expect, type Page } from '@playwright/test';

// SCEN-624: チームリーダーが権限を持たない場合、管理画面へのアクセスが拒否される。
//
// 仕様の期待結果:
// - 403 Forbidden エラーページ、または「アクセス権限がありません」というエラーメッセージが表示される
// - 提出済み日報一覧、未提出者検知、リマインダー設定、ログ確認などの管理機能にはアクセスできない
// - ユーザーは日報入力・提出画面のみへアクセス可能な状態に留まる
//
// 詳細設計との対応:
// - authenticateAndAuthorizeLeaderAccess（src/logic/user-authentication-authorization.ts）がリーダー権限判定を規定
// - InsufficientPermissionError が「管理画面へのアクセス権限がありません。」というエラーとして定義されている
//
// 注記: 本テストは仕様の文言に最も忠実な検証を実装している。
// サンプル実装の画面（login.html、panels/scr-1790147095974.html）にはまだ権限判定が実装されていないため、
// 実装の進捗に応じてテストの成功条件を調整する必要がある（詳細は unresolved.md を参照）。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('チームリーダー権限を持たないユーザーは日報確認・管理画面へアクセスが拒否される', async ({ page }) => {
  // ステップ 1: テストブラウザを起動し、日報管理システムにアクセスする
  await page.goto('/');

  // ステップ 2: チームリーダー権限を持たないユーザーアカウント（一般報告者）でログインする
  await login(page, 'reporter_scen624');

  // ステップ 3: ログイン後、日報確認・管理画面へのアクセスを試みる（URLに直接アクセス）
  await page.goto('/panels/scr-1790147095974.html');

  // ステップ 4: システムからのレスポンス結果を確認する
  // 期待結果: 以下のいずれかが成立すること
  // (a) 403 Forbidden エラーページが表示される
  // (b) 「アクセス権限がありません」というエラーメッセージが表示される
  // (c) 管理画面の機能（タブ、テーブル、ボタン）が表示されず、日報入力・提出画面へリダイレクト/リマインされる

  const errorMessage = page.getByText(/403|Forbidden|アクセス権限がありません/);
  const isErrorMessageVisible = await errorMessage.isVisible().catch(() => false);

  // 管理画面のコンテンツ要素を確認（これらが全て非表示 = アクセス拒否）
  const managementTabsVisible = await page.locator('[data-tab="reports"]').isVisible().catch(() => false);
  const reportTableVisible = await page.locator('#rm-r-tbody').isVisible().catch(() => false);
  const missingTableVisible = await page.locator('#rm-missing-tbody').isVisible().catch(() => false);
  const settingsButtonVisible = await page.locator('#rm-settings-btn').isVisible().catch(() => false);

  // 期待結果: エラーメッセージが表示されるか、または管理画面の主要な機能が全て非表示である
  const accessDenied = isErrorMessageVisible || (!managementTabsVisible && !reportTableVisible && !missingTableVisible && !settingsButtonVisible);

  expect(accessDenied).toBeTruthy();

  // ナビゲーションメニューから選択を試行しても同様にアクセスが拒否される
  await page.goto('/panels/scr-1790147087109.html');
  const adminNavLink = page.getByText('管理', { exact: true });
  const adminNavLinkExists = await adminNavLink.isVisible().catch(() => false);

  if (adminNavLinkExists) {
    await adminNavLink.click();
    // クリック後、アクセスが拒否されるか確認
    const adminErrorVisible = await page.getByText(/403|Forbidden|アクセス権限がありません/).isVisible().catch(() => false);
    expect(adminErrorVisible || page.url().includes('scr-1790147087109')).toBeTruthy();
  }

  // ユーザーは日報入力・提出画面のみへアクセス可能な状態に留まる
  await page.goto('/panels/scr-1790147087109.html');
  await expect(page.locator('#rp-content')).toBeVisible();
});
