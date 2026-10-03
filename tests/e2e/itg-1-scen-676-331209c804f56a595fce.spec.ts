import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  // 権限がない場合は管理画面へは遷移しない
  await page.waitForTimeout(2000);
}

test('SCEN-676: リーダーが管理画面にアクセスする権限がない場合、メール送信履歴確認画面へのアクセスが拒否される', async ({ page }) => {
  // ステップ1: テスト用ブラウザセッションを開く
  // (既に page が用意されている)

  // ステップ2: リーダーロール（管理画面アクセス権限なし）でシステムにログインする
  await login(page, 'reader_no_admin_scen676');

  // ステップ3: ログイン完了後、日報確認・管理画面のURL（メール送信履歴確認ページ）に直接アクセスを試みる
  const response = await page.goto('/panels/scr-1790147095974.html', { waitUntil: 'networkidle' });

  // ステップ4: サーバーからのレスポンスステータスコードを確認する
  // 期待結果: HTTPステータスコード403（Forbidden）またはHTTP 401（Unauthorized）が返却される
  if (response) {
    const status = response.status();
    expect([401, 403]).toContain(status);
  }

  // ステップ5: 画面に表示される内容を確認する

  // 期待結果: メール送信履歴確認画面は表示されない
  const mailHistoryTable = page.locator('#rm-mail-tbody');
  const isVisible = await mailHistoryTable.isVisible().catch(() => false);
  expect(isVisible).toBe(false);

  // 期待結果: 以下のいずれかが起こる：
  // (A) エラーメッセージが表示される
  // (B) ログイン画面へ自動遷移する

  const currentUrl = page.url();
  const isLoginPage = currentUrl.includes('login.html');
  const isManagementPage = currentUrl.includes('scr-1790147095974');

  // 管理画面に遷移していないことを確認
  expect(isManagementPage).toBe(false);

  // ログイン画面または他のページが表示されていることを確認
  if (isLoginPage) {
    // ケース B: ログイン画面へ自動遷移している
    expect(page.url()).toContain('login.html');
  } else {
    // ケース A: エラーメッセージが表示されている可能性
    // ページ内容を確認
    const pageText = await page.textContent('body');
    const validMessages = [
      'アクセス権限がありません',
      '管理者権限が必要です',
      'アクセスが拒否されました',
      'ページが見つかりません',
      'Forbidden',
      'Unauthorized',
    ];
    // エラーメッセージまたはログイン画面のいずれかが表示されていることを確認
    const hasErrorOrLoginContent = validMessages.some(m => pageText?.includes(m)) ||
                                   pageText?.includes('ユーザー名') ||
                                   pageText?.includes('パスワード');
    expect(hasErrorOrLoginContent).toBe(true);
  }

  // ブラウザのネットワークログ確認で、該当ページへのリクエストが拒否状態で完結していることが確認できる
  if (response) {
    expect([401, 403]).toContain(response.status());
  }
});
