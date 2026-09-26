import { test, expect } from '@playwright/test';

test.describe('SCEN-618: 送信履歴確認 - 無効なアカウントアクセス拒否', () => {
  test('アカウントが無効な報告者が送信履歴確認画面へのアクセスを試みるとアクセスが拒否される', async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/login.html');

    // 無効状態の報告者アカウントでログイン
    await page.fill('[data-testid="username"]', 'invalid_reporter');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // ログイン後、画面遷移を待機
    await page.waitForNavigation();

    // 送信履歴確認画面のURLを直接入力してアクセスを試みる
    await page.goto('/panels/scr-1790147095974.html');

    // 以下のいずれかの状態が発生することを確認：
    // (1) ログイン画面へ自動リダイレクト、または
    // (2) エラーメッセージが表示

    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('login.html');
    const hasErrorMessage = await page.locator('text=/このアカウントはアクティブではありません|アクセス権限がありません/i').isVisible();

    expect(isRedirectedToLogin || hasErrorMessage).toBeTruthy();

    // 送信履歴データが表示されていないことを確認
    const mailTable = page.locator('#rm-mail-tbody');
    if (await mailTable.isVisible()) {
      const rows = mailTable.locator('tr');
      const rowCount = await rows.count();
      expect(rowCount).toBe(0);
    }
  });
});
