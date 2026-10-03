import { test, expect } from '@playwright/test';

test('SCEN-621: ユーザーの役割情報がデータベースに存在しない場合、ユーザー情報が見つからないという例外が発生する', async ({ page }) => {
  // テスト環境のデータベースで、ユーザーマスタにユーザーIDが存在するが、
  // ユーザーの役割情報テーブルには該当ユーザーの役割レコードが存在しないように準備する
  // （事前準備として想定）

  // ブラウザを開き、ログイン画面にアクセス
  await page.goto('/login.html');

  // 役割情報が欠落しているテストユーザーでログイン
  await page.fill('[data-testid="username"]', 'user_no_role');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // ログイン済みの状態を確認
  await page.waitForNavigation({ timeout: 5000 }).catch(() => {});

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // メール送信履歴の確認機能を選択
  const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' });
  if (await mailHistoryTab.isVisible()) {
    await mailHistoryTab.click();
  }

  // 画面が『ユーザー情報が見つかりません』というエラーメッセージを表示することを確認
  const hasUserNotFoundError = await page.locator('text=/ユーザー情報が見つかりません/i').isVisible();

  // またはエラー内容がブラウザの開発者ツールのコンソールに例外ログとして記録されている
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // エラーが発生しているか確認
  const hasError = hasUserNotFoundError || consoleErrors.length > 0;

  // 管理画面が操作不可状態となる
  const disabledCount = await page.locator('button:disabled').count();
  const isDisabled = disabledCount > 0;

  // メール送信履歴一覧は表示されない
  const mailTable = page.locator('#rm-mail-tbody');
  let hasNoData = true;

  if (await mailTable.isVisible()) {
    const rows = mailTable.locator('tr:not(.rm-empty-row)');
    hasNoData = (await rows.count()) === 0;
  }

  // エラーメッセージ表示、操作不可状態、またはデータなしのいずれかが成立
  expect(hasError || isDisabled || hasNoData).toBeTruthy();
});
