import { test, expect } from '@playwright/test';

test('SCEN-620: ユーザーIDが空または null である場合、ユーザー認証に失敗して例外が発生する', async ({ page }) => {
  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // メール送信履歴確認機能を開く
  const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' });
  if (await mailHistoryTab.isVisible()) {
    await mailHistoryTab.click();
  }

  // 意図的にユーザーIDが空/nullの状態で、ユーザー認証に必要な処理をシミュレート
  // （sessionStorage内のuserId を削除・空にして、認証チェック時にエラーが発生するようにする）
  await page.evaluate(() => {
    sessionStorage.removeItem('userId');
  });

  // 画面を再読み込みしてエラー条件を確認
  await page.reload();

  // 以下のいずれかの状態が発生することを確認:
  // (1) ユーザー認証エラーに該当する例外が発生し、『ユーザー認証に失敗しました』というエラーメッセージが表示される
  // (2) ログイン画面へリダイレクト

  const hasAuthError = await page.locator('text=/ユーザー認証に失敗しました/i').isVisible();
  const isRedirected = page.url().includes('login.html');

  expect(hasAuthError || isRedirected).toBeTruthy();

  // メール送信履歴一覧は表示されず、画面は送信履歴確認前の状態に戻る
  const mailTable = page.locator('#rm-mail-tbody');
  let hasNoData = true;

  if (await mailTable.isVisible()) {
    const rows = mailTable.locator('tr:not(.rm-empty-row)');
    hasNoData = (await rows.count()) === 0;
  }

  expect(hasNoData || !await mailTable.isVisible()).toBeTruthy();
});
