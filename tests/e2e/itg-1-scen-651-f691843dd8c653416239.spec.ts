import { test, expect, type Page } from '@playwright/test';

// SCEN-651: 報告者IDが空または不正な形式のとき、エラーメッセージ
// 「報告者情報が不正です。管理者に確認してください」が表示される

test('SCEN-651: 報告者IDが空または不正な形式のとき、エラーメッセージが表示される', async ({
  page,
}) => {
  // テスト環境でPlaywrightブラウザコンテキストを初期化し、日報確認・管理画面へアクセスする
  await page.goto('/panels/scr-1790147095974.html');

  // 未提出者検知機能の実行をトリガーする
  // 管理画面の「未提出者・リマインダー」タブに移動
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();

  // ページが完全にロードされるまで待機
  await page.waitForLoadState('networkidle');

  // page.locator で対象要素を特定してエラーメッセージを待機
  // 仕様で指定されたエラーメッセージを検索
  const errorMessage = page.locator('text=報告者情報が不正です。管理者に確認してください');

  // 表示されたエラーメッセージの内容を取得し、検証対象文言と照合
  await expect(errorMessage).toBeVisible({ timeout: 5000 });

  // エラーメッセージのテキストが完全に一致することを確認
  const messageText = await errorMessage.innerText();
  expect(messageText).toContain('報告者情報が不正です。管理者に確認してください');

  // EmailNotificationService.sendNonSubmissionAlert が呼び出されないことを暗示
  // 管理画面の未提出者一覧に「通知未送信」フラグが立てられている状態を確認
  const unsentFlag = page.locator('text=通知未送信');
  await expect(unsentFlag).toBeVisible({ timeout: 5000 });
});
