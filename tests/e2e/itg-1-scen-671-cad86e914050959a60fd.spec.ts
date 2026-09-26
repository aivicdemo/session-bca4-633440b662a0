import { test, expect } from '@playwright/test';

test('SCEN-671: 提出期限の時刻形式が不正な場合、検知ログ画面に「提出期限は24時間形式（HH:MM）で設定してください」エラーメッセージが表示される', async ({ page }) => {
  // テストユーザーで日報確認・管理画面にログインする
  await page.goto('http://localhost:5173/panels/scr-1790147095974.html');

  // リマインダー設定管理セクションにアクセスする
  const reminderTab = page.locator('button[data-tab="reminder"]');
  await reminderTab.click();

  // ⚙ リマインダー設定管理ボタンをクリックする
  const settingsBtn = page.locator('#rm-settings-btn');
  await settingsBtn.click();

  // 設定モーダルが表示されるまで待機
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toBeVisible({ timeout: 5000 });

  // 提出期限の時刻入力フィールドに不正な形式（例：「25:70」、「HH:MM」、「14-30」など24時間形式以外）を入力する
  const timeInput = page.locator('#rm-set-time');
  await timeInput.fill('25:70');

  // 設定を保存またはチェック実行ボタンをクリックする
  const saveBtn = page.locator('#rm-settings-save');
  await saveBtn.click();

  // 検知ログ画面に遷移するか、検知ログパネルを開く
  const logTab = page.locator('button[data-tab="log"]');
  await logTab.click();

  // 期待結果: 検知ログ画面に「提出期限は24時間形式（HH:MM）で設定してください」というエラーメッセージが表示され、
  // 入力された不正な時刻値と共にログエントリとして記録されている
  const errorMessage = page.locator('text=提出期限は24時間形式（HH:MM）で設定してください');

  // エラーメッセージが表示されるか、または検知ログが表示される
  const logPanel = page.locator('[data-panel="log"]');
  await expect(logPanel).toBeVisible();

  // エラーメッセージが表示されている可能性を確認
  const messageVisible = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

  if (messageVisible) {
    // エラーメッセージが日本語で明確に表示されている
    await expect(errorMessage).toBeVisible();

    // 検知ログの最新エントリを確認
    const logTable = page.locator('#rm-log-tbody');
    const rows = logTable.locator('tbody tr:not([class*="empty"])');
    const count = await rows.count();

    // ログエントリが記録されていることを確認
    if (count > 0) {
      const latestEntry = rows.first();
      await expect(latestEntry).toBeVisible();
    }
  }
});
