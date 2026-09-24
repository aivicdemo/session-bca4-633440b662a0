import { test, expect, type Page } from '@playwright/test';

// SCEN-676: リーダーが管理画面にアクセスする権限がない場合、メール送信履歴確認画面へのアクセスが拒否される
// 期待: HTTPステータスコード403（Forbidden）またはHTTP 401（Unauthorized）が返却され、メール送信履歴確認画面は表示されない。
// 代わりに「アクセス権限がありません」または「管理者権限が必要です」というエラーメッセージが表示される、
// もしくはログイン画面へ自動遷移する。ブラウザのネットワークログ確認で、該当ページへのリクエストが拒否状態で完結していることが確認できる。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーが管理画面にアクセスする権限がない場合、メール送信履歴確認画面へのアクセスが拒否される', async ({
  page,
}) => {
  // テスト用ブラウザセッションを開く
  await login(page, 'reporter_no_admin');

  // ログイン完了後、日報確認・管理画面のURL（メール送信履歴確認ページ）に直接アクセスを試みる
  await page.goto('/panels/scr-1790147095974.html');

  // 403（Forbidden）または401（Unauthorized）が返却されるか、
  // またはログイン画面へ自動遷移する
  const currentUrl = page.url();

  // ケース1: ログイン画面へ遷移した場合
  if (currentUrl.includes('login.html')) {
    expect(true).toBeTruthy();
    return;
  }

  // ケース2: エラーメッセージが表示される場合
  const errorMessages = page.locator(
    'text=/アクセス権限がありません|管理者権限が必要です|権限なし|アクセス不可/',
  );
  const errorCount = await errorMessages.count();

  if (errorCount > 0) {
    await expect(errorMessages.first()).toBeVisible();
    expect(true).toBeTruthy();
    return;
  }

  // ケース3: メール送信履歴テーブルが表示されていないことを確認
  const mailTable = page.locator('#rm-mail-tbody');
  const isTableVisible = await mailTable.isVisible().catch(() => false);

  // テーブルが見えない、またはコンテンツが空の場合は拒否として扱う
  if (!isTableVisible) {
    expect(true).toBeTruthy();
    return;
  }

  // 管理画面のメール送信履歴セクションが表示されないことを確認
  const adminContent = page.locator('[data-aivic-panel="scr-1790147095974"]');
  const isAdminVisible = await adminContent.isVisible().catch(() => false);

  // 管理画面パネルが見えないか、空の状態であることを確認
  expect(!isAdminVisible || (await adminContent.textContent()).trim() === '').toBeTruthy();
});
