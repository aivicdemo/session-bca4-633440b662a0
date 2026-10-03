import { test, expect } from '@playwright/test';

test('SCEN-649: リーダーのアカウントが無効なとき、管理画面へのアクセスが拒否される', async ({ page }) => {
  // テスト環境でリーダーのアカウント（ユーザーマスタで「無効」状態に設定されたアカウント）を用意する
  await page.goto('/login.html');
  await page.fill('input[type="text"]', 'inactive-leader');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // そのリーダーアカウントで日報確認・管理画面へのアクセスを試みる
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForTimeout(1000);

  // HTTP 403 Forbidden または認証エラーページが表示され、
  // 日報確認・管理画面へのアクセスが拒否される
  const currentUrl = page.url();

  // アクセス拒否を示すエラーメッセージ、またはログイン画面へのリダイレクトを確認
  const isForbidden = await page.locator('text=403|Forbidden|アクセス拒否|権限がありません').count() > 0;
  const isLoginPage = currentUrl.includes('login');
  const isErrorPage = currentUrl.includes('error') || currentUrl.includes('denied');

  expect(isForbidden || isLoginPage || isErrorPage).toBeTruthy();

  // 画面のコンテンツ（未提出者一覧、リマインダー設定、検知ログなど）は表示されない
  const managementContent = page.locator('#rm-missing-tbody, #rm-detect-status, #rm-settings-btn, #rm-mail-tbody, #rm-log-tbody');
  const contentCount = await managementContent.count();
  expect(contentCount).toBe(0);
});
