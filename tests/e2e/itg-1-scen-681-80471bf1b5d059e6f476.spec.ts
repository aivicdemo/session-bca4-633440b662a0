import { test, expect } from '@playwright/test';

test.describe('SCEN-681: チームリーダー以外のユーザーがリマインダー設定管理画面にアクセスしようとすると、アクセスが拒否される', () => {
  test('一般報告者ユーザーがリマインダー設定管理画面へのアクセスを試行すると、アクセスが拒否される', async ({ page, context }) => {
    // ログイン画面へ遷移
    await page.goto('./login.html');

    // ログインフォームに一般報告者の認証情報を入力
    await page.fill('input[data-testid="username"]', 'tanaka.taro');
    await page.fill('input[data-testid="password"]', 'password');
    await page.click('button[data-testid="login-button"]');

    // インデックスページ経由で日報確認・管理画面へ遷移
    await page.waitForURL(/index\.html|scr-/);
    await page.goto('./panels/scr-1790147095974.html');
    await page.waitForLoadState('networkidle');

    // リマインダー設定管理ボタンが表示されているかを確認
    const settingsBtn = page.locator('#rm-settings-btn');
    const isBtnVisible = await settingsBtn.isVisible().catch(() => false);

    // ボタンが表示されている場合、クリックしてアクセスを試行
    if (isBtnVisible) {
      // ネットワークレスポンスをハンドル
      let apiResponse = null;
      page.on('response', (response) => {
        if (response.url().includes('/api/') && response.status() === 403) {
          apiResponse = response;
        }
      });

      await settingsBtn.click();

      // リマインダー設定管理モーダルが表示されないことを確認
      const settingsModal = page.locator('#rm-settings-modal');
      const isModalVisible = await settingsModal.isVisible().catch(() => false);
      expect(isModalVisible).toBe(false);
    }

    // 他の画面機能へのアクセスが可能であることを確認
    // 提出済み日報タブへのアクセスを確認
    const reportsTab = page.locator('[data-tab="reports"]');
    const isReportsTabVisible = await reportsTab.isVisible().catch(() => false);
    expect(isReportsTabVisible).toBe(true);
  });
});
