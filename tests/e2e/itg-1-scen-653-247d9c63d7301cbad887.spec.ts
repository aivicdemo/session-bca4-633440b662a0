import { test, expect, type Page } from '@playwright/test';

// SCEN-653: 日報データベースが一時的に取得できないとき、警告メッセージ
// 「日報データを取得できません。しばらく待ってから再度確認してください」が表示され、
// 未提出者一覧は表示されない。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報データベースが一時的に取得できないとき警告メッセージが表示される', async ({ page }) => {
  // 前提: 日報データベースが一時的に取得できない状態を、API 呼び出しの失敗として再現する。
  await page.route('**/api/**', async (route) => {
    const url = decodeURIComponent(route.request().url());
    if (/日報/.test(url)) {
      await route.abort('failed');
      return;
    }
    await route.continue();
  });

  // テスト環境で日報確認・管理画面にアクセスする。
  await login(page, 'user_scen653');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者検知ボタンをクリックして検知処理を実行する。
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 画面にメッセージが表示されるまで最大10秒待機する。
  await expect(
    page.getByText('日報データを取得できません。しばらく待ってから再度確認してください'),
  ).toBeVisible({ timeout: 10000 });

  // 未提出者一覧は表示されない。
  await expect(page.locator('#rm-missing-tbody .rm-missing-checkbox')).toHaveCount(0);
});
