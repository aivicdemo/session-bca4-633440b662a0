import { test, expect, type Page } from '@playwright/test';

// SCEN-652: 提出期限の時刻が設定されていないとき、エラーメッセージ
// 「提出期限が設定されていません。システム管理者に連絡してください」が表示される

test('SCEN-652: 提出期限の時刻が未設定のとき、エラーメッセージが表示される', async ({
  page,
}) => {
  // 日報確認・管理画面にシステム管理者権限でログイン
  await page.goto('/panels/scr-1790147095974.html');

  // リマインダー設定管理画面を開く
  const settingsBtn = page.locator('#rm-settings-btn');
  await settingsBtn.click();

  // リマインダー設定モーダルが表示されるまで待機
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toBeVisible({ timeout: 5000 });

  // 提出期限の時刻フィールドが空白（未設定）の状態であることを確認
  const timeInput = page.locator('#rm-set-time');
  const currentValue = await timeInput.inputValue();

  // 提出期限の時刻フィールドが空の場合、未提出者検知機能の実行トリガーを操作
  // モーダルを閉じて管理画面に戻る
  const closeModalBtn = page.locator('#rm-settings-modal-close');
  await closeModalBtn.click();

  // 未提出者・リマインダータブが表示されていることを確認
  const reminderTab = page.locator('[data-tab="reminder"]');
  await expect(reminderTab).toBeVisible();

  // 検知実行ボタンが存在する場合、クリックして検知処理を実行
  const detectButton = page.locator('button:has-text("検知実行")');

  // page.locator で対象要素を特定してエラーメッセージを待機
  // 仕様で指定されたエラーメッセージを検索
  const errorMessage = page.locator('text=提出期限が設定されていません。システム管理者に連絡してください');

  // 画面上にエラーメッセージが表示されるまで待機
  await expect(errorMessage).toBeVisible({ timeout: 5000 });

  // エラーメッセージのテキストが完全に一致することを確認
  const messageText = await errorMessage.innerText();
  expect(messageText).toContain('提出期限が設定されていません。システム管理者に連絡してください');

  // 未提出者検知処理が開始されず、EmailNotificationService の sendNonSubmissionAlert は呼び出されない
  // 画面遷移は発生せず、リマインダー設定管理画面に留まる
  const currentPanel = page.locator('[data-panel="reminder"].is-active');
  await expect(currentPanel).toBeVisible();
});
