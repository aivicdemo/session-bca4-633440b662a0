import { test, expect, type Page } from '@playwright/test';

// SCEN-678: リマインダー設定の送信時刻・送信曜日・送信方法を変更し、保存すると設定が反映される
//
// panels/scr-1790147095974.html の #rm-settings-save クリックハンドラは、AIVIC_PAGE_INIT_JS 内のローカル変数
// settings（enabled/time/days/method）をその場で書き換えるだけであり、サーバー側 API・localStorage・
// sessionStorage への保存は一切行っていない。ページを再読み込みすると settings はスクリプト初期化時の
// ハードコード値（time: '18:00', days: ['月','火','水','木','金'], method: 'メール'）に戻るため、仕様の
// 期待結果である「ページ再読み込み後も変更後の値が表示される」は現状のサンプル実装では成立しない可能性が高い。
// この食い違いは .aivic/batches/18/unresolved.md に記録し、本テストは仕様の期待結果の文言どおりに検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

async function openReminderSettingsModal(page: Page) {
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  await page.locator('#rm-settings-btn').click();
  await expect(page.locator('#rm-settings-modal')).toHaveClass(/is-visible/);
}

test('リマインダー設定の送信時刻・送信曜日・送信方法を変更し、保存すると設定が反映される', async ({ page }) => {
  // 手順1: 日報確認・管理画面にログインする
  await login(page, 'leader_scen678');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順2: リマインダー設定管理セクションを開く
  await openReminderSettingsModal(page);

  // 手順3: 現在のリマインダー設定を確認する（送信時刻・送信曜日・送信方法の現在値をメモ）
  await expect(page.locator('#rm-set-time')).toHaveValue('18:00');
  await expect(page.locator('#rm-set-method')).toHaveValue('メール');

  // 手順4: 送信時刻を変更する（9:00 → 10:30 に相当する変更）
  await page.locator('#rm-set-time').fill('10:30');

  // 手順5: 送信曜日を変更する（月〜金 → 月・水・金）
  const allDays = ['月', '火', '水', '木', '金', '土', '日'];
  const targetDays = ['月', '水', '金'];
  for (const day of allDays) {
    const checkbox = page.locator(`.rm-day-checkbox[data-day="${day}"]`);
    await checkbox.setChecked(targetDays.includes(day));
  }

  // 手順6: 送信方法を変更する（メール → アプリ通知。システムがサポートする2つの方法のうち別の値に変更）
  await page.locator('#rm-set-method').selectOption('アプリ通知');

  // 手順7: 「保存」ボタンをクリックする
  await page.locator('#rm-settings-save').click();

  // 手順8: 保存完了メッセージが画面に表示されるまで待機する
  const toast = page.locator('#rm-toast');
  await expect(toast).toHaveClass(/is-visible/);
  await expect(toast).toContainText('リマインダー設定を保存しました。');

  // 手順9: ページを再読み込みする
  await page.reload();

  // 手順10: リマインダー設定管理セクションで現在の設定値を確認する
  await openReminderSettingsModal(page);

  // 期待結果: 送信時刻が10:30、送信曜日が月・水・金、送信方法が変更後の値になっている
  await expect(page.locator('#rm-set-time')).toHaveValue('10:30');
  for (const day of targetDays) {
    await expect(page.locator(`.rm-day-checkbox[data-day="${day}"]`)).toBeChecked();
  }
  for (const day of allDays.filter((d) => !targetDays.includes(d))) {
    await expect(page.locator(`.rm-day-checkbox[data-day="${day}"]`)).not.toBeChecked();
  }
  await expect(page.locator('#rm-set-method')).toHaveValue('アプリ通知');
});
