import { test, expect, type Page } from '@playwright/test';

// SCEN-666: 検知ログ画面で、リマインダーメール送信に失敗した未提出者に「通知未送信」フラグが表示される。
//
// panels/scr-1790147095974.html には「Amazon SESのメール送信機能を失敗させる」「管理設定でメール送信先を
// 無効なアドレスに変更する」ための管理設定UIが存在しない（システム設定・メール送信先変更に相当するボタン・
// フォームは ui-reference.md のボタン一覧・visibleTexts にも含まれない）。「選択した未提出者にリマインダーを
// 送信」ボタン（#rm-send-reminder-btn）を押すと、AIVIC_PAGE_INIT_JS の実装上は常に成功として扱われ、
// 指数バックオフ再試行や送信失敗を模したロジックは存在しない。検知ログタブ（#rm-log-tbody）およびその詳細
// モーダルが表示するリマインダー送信状態の文言は「送信済み」「未送信」の2値のみであり、仕様が期待する
// 「通知未送信」「通知送信済み」という文言は表示されない。この食い違いは .aivic/batches/15/unresolved.md に
// 記録する。本テストは、画面上で実行可能な操作（リマインダー送信の実行、検知ログタブでのステータス確認）に
// 代替しつつ、期待結果の文言どおりに検証を記述する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リマインダーメール送信に失敗した未提出者に「通知未送信」フラグが表示される', async ({ page }) => {
  // テスト対象ユーザー（管理者）で日報確認・管理画面にログインする。
  await login(page, 'admin_scen666');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 日報確認・管理画面のリマインダー送信ボタンを実行して、未提出者へのリマインダーメール送信処理を開始する。
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  const missingCheckboxes = page.locator('.rm-missing-checkbox');
  await expect(missingCheckboxes.first()).toBeVisible();
  await missingCheckboxes.first().check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // メール送信が失敗し、最大3回の指数バックオフ再試行が完了するまで待機する。
  await page.waitForTimeout(1000);

  // 「検知ログ」タブ（またはメール送信履歴画面）を開く。
  await page.locator('.rm-tab[data-tab="log"]').click();

  // 該当する未提出者のレコードを検索・表示して、ステータスフラグカラムを確認する。
  const logRows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  await expect(logRows.first()).toBeVisible();

  // 検知ログ画面に表示される該当未提出者のレコードに「通知未送信」フラグが表示され、他のステータス
  // （例：「通知送信済み」）と明確に区別できる表記になっている。
  const targetLogRow = logRows.first();
  await expect(targetLogRow).toContainText('通知未送信');
  await expect(targetLogRow).not.toContainText('通知送信済み');
});
