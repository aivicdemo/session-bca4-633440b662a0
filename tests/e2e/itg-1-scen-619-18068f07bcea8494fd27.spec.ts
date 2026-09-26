import { test, expect } from '@playwright/test';

test.describe('SCEN-619: 送信履歴確認 - 権限拒否', () => {
  test('報告者ではない役割のユーザーが送信履歴確認画面へのアクセスを試みるとアクセスが拒否される', async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/login.html');

    // 報告者ではない役割（例：閲覧のみ権限）でログイン
    await page.fill('[data-testid="username"]', 'viewer_user');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // ログイン後、画面遷移を待機
    await page.waitForNavigation();

    // 日報確認・管理画面にアクセスしてみる
    await page.goto('/panels/scr-1790147095974.html');

    // 画面内で送信履歴確認機能への遷移を試みる
    const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' });
    
    if (await mailHistoryTab.isVisible()) {
      // ボタンが見える場合、クリックを試みる
      await mailHistoryTab.click();
    }

    // 以下のいずれかの状態が発生することを確認：
    // (1) URLがログイン画面にリダイレクト
    // (2) エラーメッセージが表示
    // (3) 送信履歴データが表示されない

    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('login.html');
    const hasErrorMessage = await page.locator('text=/アクセス権限がありません|この機能へのアクセス権限がありません/i').isVisible();
    
    const mailTable = page.locator('#rm-mail-tbody');
    const mailDataVisible = await mailTable.isVisible();
    let hasNoData = false;
    
    if (mailDataVisible) {
      const rows = mailTable.locator('tr:not(.rm-empty-row)');
      hasNoData = (await rows.count()) === 0;
    }

    expect(isRedirected || hasErrorMessage || !mailDataVisible || hasNoData).toBeTruthy();
  });
});
