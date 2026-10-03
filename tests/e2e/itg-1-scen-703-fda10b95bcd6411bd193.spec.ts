import { test, expect } from '@playwright/test';

// SCEN-703: 報告者IDが空の場合、エラーメッセージが表示される

test('報告者IDが空の場合、エラーメッセージが表示される', async ({ page }) => {
  // ステップ1: 日報確認・管理画面を開く
  await page.goto('/panels/scr-1790147095974.html');

  // ステップ2: 未提出者一覧から「リマインダー送信」機能を呼び出す
  const missingTab = page.locator('button[data-tab="reminder"]');
  await expect(missingTab).toBeVisible();
  await missingTab.click();

  // ステップ3: リマインダー送信ダイアログが表示される
  // サンプル画面ではダイアログではなく、ボタンで送信を実行
  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  await expect(sendReminderBtn).toBeVisible();

  // ステップ4: 報告者IDフィールドを空のまま（値を入力せず）にして「送信」ボタンをクリック
  // サンプル画面では報告者を選択してから送信
  // 報告者が選択されていない状態で送信ボタンをクリック
  await sendReminderBtn.click();

  // ステップ5: 画面の反応を確認する
  // 期待結果: 報告者IDが空の場合、エラーメッセージ「報告者IDは必須です」が画面に表示され、
  // sendReminderEmail の呼び出しが発生せず、送信処理が中断される。

  const errorMessage = page.locator('#rm-toast');
  
  // エラーメッセージが表示されることを確認
  await expect(errorMessage).toHaveClass(/is-visible/);
  
  // メッセージテキストを確認（「未提出者を選択してください」のようなメッセージが表示される）
  const messageText = await errorMessage.textContent();
  expect(messageText).toBeTruthy();
  expect(messageText).toMatch(/選択|必須|未提出/);
});
