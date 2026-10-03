import { test, expect } from '@playwright/test';

test('SCEN-650: リーダーに管理画面アクセス権限がないとき、管理画面へのアクセスが拒否される', async ({ page }) => {
  // テスト用ユーザー（リーダー権限、管理画面アクセス権限なし）でログインする
  await page.goto('/login.html');
  await page.fill('input[type="text"]', 'reporter-without-admin-access');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // ログイン後、日報確認・管理画面へのアクセスURLを直接入力またはナビゲーションメニューから遷移を試みる
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForTimeout(1000);

  // システムからのレスポンスを確認する
  const currentUrl = page.url();

  // 管理画面への遷移が拒否され、HTTP 403（Forbidden）エラーまたはアクセス権限不足を示す画面が表示される
  const isForbiddenMessage = await page.locator('text=403|Forbidden|権限|この画面にアクセスする権限がありません').count() > 0;

  // ユーザーは日報入力・提出画面へリダイレクトされるか、エラーメッセージが表示される
  const isRedirectedToSubmission = currentUrl.includes('scr-1790147087109');
  const isErrorPage = currentUrl.includes('error') || currentUrl.includes('denied') || currentUrl.includes('forbidden');
  const hasPermissionError = await page.locator('text=この画面にアクセスする権限がありません').count() > 0;

  expect(isForbiddenMessage || isRedirectedToSubmission || isErrorPage || hasPermissionError).toBeTruthy();

  // 管理画面のコンテンツが表示されないことを確認
  const managementElements = page.locator('#rm-missing-tbody, #rm-detect-status, #rm-settings-btn, #rm-mail-tbody, #rm-log-tbody');
  const elementCount = await managementElements.count();
  expect(elementCount).toBe(0);
});
