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
  // テスト用ブラウザセッションを開く
  // (既に page が用意されている)

  // リーダーロール（管理画面アクセス権限なし）でシステムにログインする
  await login(page, 'reader_no_admin_scen676');

  // ログイン完了後、日報確認・管理画面のURL（メール送信履歴確認ページ）に直接アクセスを試みる
  const response = await page.goto('/panels/scr-1790147095974.html', { waitUntil: 'networkidle' });

  // サーバーからのレスポンスステータスコードを確認する
  // 403（Forbidden）またはHTTP 401（Unauthorized）が返却される
  if (response) {
    const status = response.status();
    expect([401, 403]).toContain(status);
  }

  // メール送信履歴確認画面は表示されない。代わりに以下のいずれかが起こる：
  // (A) エラーメッセージが表示される
  // (B) ログイン画面へ自動遷移する

  // ケース A: エラーメッセージを確認
  const errorElements = page.locator('[class*="error"], [class*="denied"], [class*="forbidden"]');
  const errorCount = await errorElements.count();

  if (errorCount > 0) {
    // エラーメッセージが存在する場合
    const errorText = await page.locator('[class*="error"], [class*="denied"]').first().textContent();
    const validMessages = [
      'アクセス権限がありません',
      '管理者権限が必要です',
      'アクセスが拒否されました',
      'ページが見つかりません',
    ];
    expect(errorText).toBeTruthy();
    expect(validMessages.some(m => errorText?.includes(m))).toBe(true);
  } else {
    // ケース B: ログイン画面へ自動遷移している
    expect(page.url()).toContain('login.html');
  }

  // メール送信履歴確認画面の要素（#rm-mail-tbody など）が表示されていないことを確認
  const mailHistoryTable = page.locator('#rm-mail-tbody');
  const isVisible = await mailHistoryTable.isVisible().catch(() => false);
  expect(isVisible).toBe(false);

  // ブラウザのネットワークログ確認で、該当ページへのリクエストが拒否状態で完結していることが確認できる
  // （レスポンスステータス確認済み）
  if (response) {
    expect([401, 403]).toContain(response.status());
  }
});
