import { test, expect, type Page } from '@playwright/test';

// SCEN-671: 提出期限の時刻形式が不正な場合、検知ログ画面に
// 「提出期限は24時間形式（HH:MM）で設定してください」エラーメッセージが表示される。
//
// panels/scr-1790147095974.html の「リマインダー設定管理」モーダル（#rm-settings-modal）の送信時刻欄
// （#rm-set-time）は `<input type="time">` のネイティブ時刻入力であり、ブラウザの制約上「25:70」「14-30」等の
// 24時間形式以外の文字列はそもそも値として保持できない（ネイティブ time input は不正な値を空文字列に強制する）。
// また保存ボタン（#rm-settings-save）のクリックハンドラは `settings.time = value || settings.time` を実行する
// だけで、時刻形式の妥当性検証は一切行われない。詳細設計上、最も近い概念は
// daily-report-reminder-notification.ts の manageReminderNotificationSettings の InvalidSettingParametersError
// （メッセージ「リマインダー設定のパラメータが無効です。」）だが、文言が仕様と一致しない。加えて検知ログ
// （#rm-log-tbody）は固定モック配列を表示するのみで、リマインダー設定の保存操作やエラー発生を検知ログの
// エントリとして記録する実装は存在しない。
// 本テストでは、ネイティブ time input の制約を回避するため input 要素を一時的に type="text" に切り替えて
// 不正な文字列を入力し、仕様の手順・期待結果をそのまま検証した。詳細は .aivic/batches/16/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('提出期限の時刻形式が不正な場合、検知ログ画面にエラーメッセージと共に記録される', async ({ page }) => {
  // テストユーザーで日報確認・管理画面にログインする
  await login(page, 'leader_scen671');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // リマインダー設定管理セクションにアクセスする
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  await page.locator('#rm-settings-btn').click();
  await expect(page.locator('#rm-settings-modal')).toBeVisible();

  // 提出期限の時刻入力フィールドに不正な形式（例：「25:70」）を入力する
  const invalidValue = '25:70';
  await page.evaluate(() => {
    const el = document.querySelector('#rm-set-time') as HTMLInputElement | null;
    if (el) el.setAttribute('type', 'text');
  });
  await page.locator('#rm-set-time').fill(invalidValue);

  // 設定を保存またはチェック実行ボタンをクリックする
  await page.locator('#rm-settings-save').click();

  // 検知ログ画面に遷移するか、検知ログパネルを開く
  await page.locator('.rm-tab[data-tab="log"]').click();

  // 検知ログの最新エントリを確認する
  const latestEntry = page.locator('#rm-log-tbody tr:not(.rm-empty-row)').first();
  await expect(latestEntry).toContainText('提出期限は24時間形式（HH:MM）で設定してください');
  await expect(latestEntry).toContainText(invalidValue);
});
