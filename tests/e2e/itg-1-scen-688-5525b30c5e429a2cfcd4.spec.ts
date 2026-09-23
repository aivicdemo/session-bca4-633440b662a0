import { test, expect, type Page } from '@playwright/test';

// SCEN-688: 送信したリマインダーメールの履歴がリーダーが送信状況を確認できるように記録される。
//
// panels/scr-1790147095974.html の「メール送信履歴」タブ（#rm-mail-tbody）は送信日時・メールタイプ・送信先・件名・
// ステータスの5列で構成される。リマインダー送信操作で新規追加される履歴の送信日時は 'YYYY-MM-DD HH:MM' 形式で
// あり、仕様が期待する ISO 8601 形式（例：2026-09-23T09:00:00Z）ではない。また配信状態は「成功」と表示され、
// 仕様が期待する「送信完了」という文言ではない。送信対象ユーザー名は「送信先」列にメールアドレス
// （name@example.com の形式）として表示され、氏名そのものではない。本テストは仕様の期待結果の文言どおりに
// 検証を記述したが、上記の表記差異により成立しない可能性が高い。詳細は .aivic/batches/19/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リマインダーメール送信後、メール送信履歴に送信日時・対象ユーザー・種別・配信状態が記録される', async ({ page }) => {
  // 1. リーダーが日報確認・管理画面にログインする
  await login(page, 'leader_scen688');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 2. 管理画面の「未提出者一覧」セクションで、提出期限を超過したユーザーが表示されていることを確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);
  const targetRow = rows.first();
  const targetName = (await targetRow.locator('td').nth(1).textContent())?.trim() ?? '';

  // 3. 未提出者に対して「リマインダー送信」ボタンをクリックする
  await targetRow.locator('.rm-missing-checkbox').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 4. リマインダー送信処理が完了し、画面がリーダーに戻る
  await expect(page.locator('#rm-toast')).toHaveClass(/is-visible/);

  // 5. 管理画面の「メール送信履歴」セクションを開く
  await page.getByText('メール送信履歴', { exact: true }).click();

  // 6. 送信日時、送信対象ユーザー、送信内容種別（「リマインダー」）、配信状態が履歴レコードとして表示される
  //    ことを確認する
  const historyRow = page.locator('#rm-mail-tbody tr', { hasText: targetName }).first();
  await expect(historyRow).toBeVisible();
  await expect(historyRow).toContainText('リマインダー');
  await expect(historyRow).toContainText('送信完了');
  const sentAtCell = (await historyRow.locator('td').nth(0).textContent())?.trim() ?? '';
  expect(sentAtCell).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

  // 複数回送信した場合、各回の履歴がタイムスタンプ順に一覧表示される
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  await targetRow.locator('.rm-missing-checkbox').check();
  await page.locator('#rm-send-reminder-btn').click();
  await page.getByText('メール送信履歴', { exact: true }).click();
  const timestamps = await page.locator('#rm-mail-tbody tr td:nth-child(1)').allTextContents();
  const sorted = [...timestamps].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  expect(timestamps).toEqual(sorted);
});
