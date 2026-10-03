import { test, expect } from '@playwright/test';

test('SCEN-618: アカウントが無効な報告者が送信履歴確認画面へのアクセスを試みるとアクセスが拒否される', async ({ page }) => {
  // テスト用ユーザーマスタにて、報告者アカウントを『無効』状態に設定する
  // （テスト環境では事前に設定されていると仮定）

  // ブラウザを開き、日報管理システムのログイン画面にアクセスする
  await page.goto('/login.html');

  // 無効状態の報告者アカウントのログイン認証情報を入力し、ログインボタンをクリック
  await page.fill('[data-testid="username"]', 'invalid_reporter');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // ログイン処理が完了した後、ブラウザのアドレスバーに送信履歴確認画面のURLを直接入力してアクセスを試みる
  await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  await page.goto('/panels/scr-1790147095974.html');

  // 画面の遷移・コンテンツ表示状態を確認
  const currentUrl = page.url();
  const isRedirectedToLogin = currentUrl.includes('login.html');

  // 以下のいずれかの画面状態が表示されることを確認:
  // (1) ログイン画面へ自動的にリダイレクトされる、または
  // (2) 『このアカウントはアクティブではありません』『アクセス権限がありません』などのエラーメッセージが表示される
  const hasErrorMessage = await page.locator('text=/このアカウントはアクティブではありません|アクセス権限がありません/i').isVisible();

  expect(isRedirectedToLogin || hasErrorMessage).toBeTruthy();

  // 送信履歴データは表示されない
  const mailTable = page.locator('#rm-mail-tbody');
  if (await mailTable.isVisible()) {
    const rows = mailTable.locator('tr:not(.rm-empty-row)');
    const rowCount = await rows.count();
    expect(rowCount).toBe(0);
  }
});
