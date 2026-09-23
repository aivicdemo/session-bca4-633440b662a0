import { test, expect, type Page } from '@playwright/test';

// SCEN-657: メール配信サービスが一時的に利用不可のとき、最大3回まで指数バックオフで再試行され、3回失敗後は
// 管理者に通知される。
//
// panels/scr-1790147095974.html にはメール配信サービス（Amazon SES 相当）を一時的に利用不可にする設定・APIは
// 存在しない。「選択した未提出者にリマインダーを送信」ボタン（#rm-send-reminder-btn）押下時の処理は
// window.AIVIC_PAGE_INIT_JS 内で常に mailHistory へステータス「成功」のレコードを追加するのみで、送信失敗・
// 指数バックオフによる自動再試行・3回失敗後の管理者通知のいずれも実装されていない。画面上部に『通知送信失敗』
// というメッセージ・アラートを表示する仕組みも存在せず、未提出者一覧（#rm-missing-tbody）にも「通知未送信」
// フラグを表示する列は存在しない（列はチェックボックス・報告者名・対象日付・最終リマインダー送信日時の4列のみ）。
// 検知ログ・メール送信履歴確認エリアにも『送信失敗：3回再試行後』という履歴レコードを生成する仕組みはない。
// 本テストは、画面上で1回のリマインダー送信操作を行い、それを3回分の試行に見立てて期待結果の文言どおりの検証を
// 記述したが、現状のサンプル実装では成立しない可能性が高い。詳細は .aivic/batches/13/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('メール配信サービスが利用不可のとき、3回再試行後に通知送信失敗が記録される', async ({ page }) => {
  // 日報確認・管理画面にログイン（管理者権限）
  await login(page, 'admin_scen657');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 画面上で未提出者が一覧表示されるまで待機する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();
  const targetRow = rows.first();
  await targetRow.locator('.rm-missing-checkbox').check();

  // 未提出者に対するリマインダー送信操作を実行（1回目の送信試行）
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 1回目の送信試行が失敗し、画面に『通知送信失敗』というメッセージまたはアラートが表示される
  await expect(page.getByText('通知送信失敗')).toBeVisible();

  // 指数バックオフの待機時間を経て、2回目の自動再試行が行われ、同じメッセージが再度表示される
  await targetRow.locator('.rm-missing-checkbox').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();
  await expect(page.getByText('通知送信失敗')).toBeVisible();

  // 指数バックオフの待機時間を経て、3回目の自動再試行が行われ、同じメッセージが再度表示される
  await targetRow.locator('.rm-missing-checkbox').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();
  await expect(page.getByText('通知送信失敗')).toBeVisible();

  // 日報確認・管理画面を更新（リロード）して、最新状態を表示する
  await page.reload();
  await page.getByText('未提出者・リマインダー', { exact: true }).click();

  // 未提出者一覧に対して、該当ユーザーの行に『通知未送信』フラグが表示される
  await expect(page.locator('#rm-missing-tbody').getByText('通知未送信')).toBeVisible();

  // 検知ログ・メール送信履歴確認エリアに『送信失敗：3回再試行後』という履歴レコードが表示される
  await page.getByText('メール送信履歴', { exact: true }).click();
  await expect(page.locator('#rm-mail-tbody').getByText('送信失敗：3回再試行後')).toBeVisible();
});
