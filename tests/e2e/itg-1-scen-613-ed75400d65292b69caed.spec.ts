import { test, expect, type Page } from '@playwright/test';

// SCEN-613: メール送信サーバーへの接続に失敗した場合、送信失敗がシステムログに記録され
// 管理画面に警告が表示される。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('メール送信サーバーへの接続に失敗した場合、送信失敗の警告とログが確認できる', async ({ page }) => {
  await login(page, 'admin_scen613');

  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // EmailNotificationService.sendReminderEmail がメール送信サーバーへの接続失敗を返す状況を、
  // 通信レベルでスタブして再現する（アプリ側に該当する API 呼び出しが実在しない場合は効果を持たない）。
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (/メール|mail|reminder/i.test(url)) {
      await route.abort('connectionfailed');
      return;
    }
    await route.continue();
  });

  await page.locator('.rm-tab[data-tab="reminder"]').click();

  const firstMissingCheckbox = page.locator('.rm-missing-checkbox').first();
  await expect(firstMissingCheckbox).toBeVisible();
  await firstMissingCheckbox.check();

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 期待結果(1): 通知送信結果エリアに「通知送信失敗」という警告テキストが表示される。
  await expect(page.getByText('通知送信失敗')).toBeVisible();

  // 期待結果(2): 検査ログ表示機能で該当のエラー内容が確認できる。
  await page.locator('.rm-tab[data-tab="log"]').click();
  await expect(
    page.getByText('メール送信サーバー接続失敗 - リマインダーメール送信時にエラー発生'),
  ).toBeVisible();
});
