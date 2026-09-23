import { test, expect, type Page } from '@playwright/test';

// SCEN-668: 提出期限の時刻が設定されていない場合、検知ログ画面に「提出期限が設定されていません。
// システム管理者に連絡してください」エラーメッセージが表示される。
//
// panels/scr-1790147095974.html の「日報リマインダー設定」に対応するUIは、検知ログタブとは独立した
// 「⚙ リマインダー設定管理」モーダル（#rm-settings-modal）内の送信時刻フィールド（#rm-set-time、
// type="time"）であり、空にして保存しようとしても JS 側で `settings.time = ... || settings.time`
// と既存値にフォールバックするため、そもそも「未設定（NULL）」状態を作ることができない。また検知ログタブ
// （#rm-log-tbody）の描画（renderLogs）はハードコードされた logs 配列を表示するだけで、リマインダー設定の
// 送信時刻の有無を判定する処理も、それに応じたエラーメッセージ表示処理も存在しない。詳細設計上、最も近い
// 概念は business-day-deadline-judgment.ts の DeadlineTimeUndefinedError
// 「日報提出期限が未定義のため判定できません。」だが、文言が仕様の期待結果と一致しない。この食い違いは
// .aivic/batches/15/unresolved.md に記録する。本テストは仕様の手順・期待結果の文言に忠実に検証を記述する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('提出期限の時刻が設定されていない場合、検知ログ画面にエラーメッセージが表示される', async ({ page }) => {
  // 日報確認・管理画面にログインし、管理者権限を持つユーザーで操作する
  // （テスト用DBのリマインダー設定テーブルの「提出期限時刻」カラムをNULLに設定した前提）。
  await login(page, 'admin_scen668');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 検知ログ確認機能を開く（検知ログ・メール送信履歴確認セクション内）。
  await page.locator('.rm-tab[data-tab="log"]').click();

  // 検知ログ画面の初期表示時、または検知ログデータ一覧をリロード・再読込を実行する。
  await page.reload();
  await page.locator('.rm-tab[data-tab="log"]').click();

  // 検知ログ画面のメインメッセージエリアに「提出期限が設定されていません。システム管理者に連絡してください」
  // というエラーメッセージが画面上に表示される。
  await expect(page.getByText('提出期限が設定されていません。システム管理者に連絡してください')).toBeVisible();

  // 検知ログの一覧はレンダリングされず、エラーメッセージのみが表示される状態となる。
  const logRows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  await expect(logRows).toHaveCount(0);
});
