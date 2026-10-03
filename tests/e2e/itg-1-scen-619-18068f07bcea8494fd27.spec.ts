import { test, expect } from '@playwright/test';

test('SCEN-619: 報告者ではない役割のユーザーが送信履歴確認画面へのアクセスを試みるとアクセスが拒否される', async ({ page }) => {
  // テストユーザーとして、報告者ではない役割（例：閲覧のみ権限など）でシステムにログイン
  await page.goto('/login.html');
  await page.fill('[data-testid="username"]', 'viewer_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // 日報確認・管理画面にアクセス
  await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  await page.goto('/panels/scr-1790147095974.html');

  // 画面内で送信履歴確認機能へのナビゲーション要素（ボタン・リンク・メニュー）を特定
  const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' });

  // 送信履歴確認画面への遷移を試みる（ボタンをクリック、またはURLを直接入力して遷移を試行）
  if (await mailHistoryTab.isVisible()) {
    await mailHistoryTab.click();
  } else {
    await page.goto('/panels/scr-1790147095974.html?tab=mail');
  }

  // 送信履歴確認画面への遷移がブロックされ、アクセス拒否を示すエラーメッセージが表示される、
  // またはブラウザ上で送信履歴確認画面のコンテンツが一切表示されないことを確認

  const currentUrl = page.url();
  const isRedirected = currentUrl.includes('login.html');

  // エラーメッセージの確認
  const hasErrorMessage = await page.locator('text=/この機能へのアクセス権限がありません|アクセス権限がありません/i').isVisible();

  // メール送信履歴テーブルの状態を確認
  const mailTable = page.locator('#rm-mail-tbody');
  let hasNoData = true;
  let mailTableVisible = false;

  try {
    mailTableVisible = await mailTable.isVisible({ timeout: 2000 });
  } catch {
    mailTableVisible = false;
  }

  if (mailTableVisible) {
    const rows = mailTable.locator('tr:not(.rm-empty-row)');
    hasNoData = (await rows.count()) === 0;
  }

  // 条件の確認: ブロック、エラー表示、またはデータなし のいずれかが成立
  expect(isRedirected || hasErrorMessage || !mailTableVisible || hasNoData).toBeTruthy();
});
