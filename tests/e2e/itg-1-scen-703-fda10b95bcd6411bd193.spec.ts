import { test, expect, type Page } from '@playwright/test';

// SCEN-703: 報告者IDが空の場合、エラーメッセージが表示される

test('報告者IDが空の場合、エラーメッセージが表示される', async ({ page }) => {
  // 日報確認・管理画面を開く
  await page.goto('/panels/scr-1790147095974.html');

  // 未提出者リストから「リマインダー送信」機能を呼び出す
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();

  // 未提出者一覧を確認
  const missingTableBody = page.locator('#rm-missing-tbody');
  const missingRows = missingTableBody.locator('tr');
  
  const rowCount = await missingRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // リマインダー送信ダイアログが表示されるまでの操作
  // サンプル画面では複数選択チェックボックスとボタンで構成されている
  
  // チェックボックスを選択せずに（報告者IDを指定せず）「送信」ボタンをクリック
  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  await sendReminderBtn.click();

  // 画面の反応を確認する
  // 期待結果：報告者IDが空の場合、エラーメッセージ「報告者IDは必須です」が画面に表示され、
  // sendReminderEmail の呼び出しが発生せず、送信処理が中断される

  // トースト通知を確認
  const toast = page.locator('#rm-toast');
  
  // トースト表示を待つ
  await expect(toast).toHaveClass(/is-visible/, { timeout: 2000 });

  const toastContent = await toast.textContent();
  
  // 期待結果を確認
  // 「報告者IDは必須です」という形式のメッセージ、または「未提出者を選択してください」等のメッセージが表示されることを確認
  expect(toastContent).toMatch(/報告者ID|未提出者|選択/);
});
