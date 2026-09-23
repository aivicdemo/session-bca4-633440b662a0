import { test, expect, type Page } from '@playwright/test';

// SCEN-665: 検知ログ画面で、リマインダーメール送信済みの未提出者に「リマインダー送信済み」ステータスが
// 表示される。
//
// panels/scr-1790147095974.html の「メール送信履歴」タブ（#rm-mail-tbody）は 送信日時・メールタイプ・送信先・
// 件名・ステータス の5列で構成され、ステータス列には「成功」「失敗」「保留中」（アイコン付き）のいずれかが
// 表示されるのみで、「リマインダー送信済み」という値は表示されない。一方「検知ログ」タブの詳細モーダル
// （#rm-view-modal-body）には <dt>リマインダー送信済み</dt> というラベルの行があり、値は「送信済み」または
// 「未送信」で表示される（ラベルが「リマインダー送信済み」であり、値そのものではない）。仕様が期待する
// 「検索結果のステータス列に『リマインダー送信済み』と表示され、送信日時・送信先メールアドレス・送信種別
// （リマインダー）も画面に表示される」という組み合わせに一致する単一のUI要素は存在しない。この食い違いは
// .aivic/batches/15/unresolved.md に記録する。本テストは、メール送信履歴タブでリマインダー種別に絞り込んだ
// 上で、仕様の期待結果の文言に忠実に検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('検知ログ画面で、リマインダーメール送信済みの未提出者に「リマインダー送信済み」ステータスが表示される', async ({
  page,
}) => {
  // 管理者として日報確認・管理画面にログインする。
  await login(page, 'admin_scen665');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者一覧から、リマインダーメール送信済みのユーザーを特定する。
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  const missingRows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(missingRows.first()).toBeVisible();
  const remindedRow = missingRows.filter({ hasNotText: '未送信' }).first();
  const targetName = (await remindedRow.locator('td').nth(1).textContent())?.trim() ?? '';
  expect(targetName.length).toBeGreaterThan(0);

  // 「検知ログ」または「メール送信履歴」セクションに遷移する。
  await page.locator('.rm-tab[data-tab="mail"]').click();

  // 検索条件またはフィルタで、特定したユーザーのリマインダーメール送信記録を検索する。
  await page.locator('#rm-m-type').selectOption('リマインダー');

  // 該当ユーザーの送信記録行を画面上で確認する。
  const mailRows = page.locator('#rm-mail-tbody tr:not(.rm-empty-row)');
  await expect(mailRows.first()).toBeVisible();

  // 検索結果に該当ユーザーのリマインダーメール送信記録が表示され、ステータス列に「リマインダー送信済み」と
  // 表示される。また、送信日時・送信先メールアドレス・送信種別（リマインダー）が画面に表示される。
  await expect(mailRows.first()).toContainText('リマインダー送信済み');
  await expect(mailRows.first()).toContainText(/\d{4}-\d{2}-\d{2}/);
  await expect(mailRows.first()).toContainText('@');
  await expect(mailRows.first()).toContainText('リマインダー');
});
