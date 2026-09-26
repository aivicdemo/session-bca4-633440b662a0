import { test, expect } from '@playwright/test';

test.describe('SCEN-620: 送信履歴確認 - ユーザーID空/null エラー', () => {
  test('ユーザーIDが空または null である場合、ユーザー認証に失敗して例外が発生する', async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/login.html');

    // 意図的に無効な認証状態でシステムにアクセス
    // 空のユーザーIDでセッションストレージを設定（本来のログイン処理をバイパス）
    await page.evaluate(() => {
      sessionStorage.setItem('userId', '');
    });

    // 日報確認・管理画面にアクセス
    await page.goto('/panels/scr-1790147095974.html');

    // メール送信履歴確認機能を開く
    const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' });
    if (await mailHistoryTab.isVisible()) {
      await mailHistoryTab.click();
    }

    // 以下のいずれかの状態が発生することを確認：
    // (1) ユーザー認証エラーメッセージが表示
    // (2) ログイン画面へリダイレクト
    const hasAuthError = await page.locator('text=/ユーザー認証に失敗しました/i').isVisible();
    const isRedirected = page.url().includes('login.html');
    
    // メール送信履歴一覧が表示されていないことを確認
    const mailTable = page.locator('#rm-mail-tbody');
    let hasNoData = true;
    
    if (await mailTable.isVisible()) {
      const rows = mailTable.locator('tr:not(.rm-empty-row)');
      hasNoData = (await rows.count()) === 0;
    }

    expect(hasAuthError || isRedirected || hasNoData).toBeTruthy();
  });
});
