import { test, expect, type Page } from '@playwright/test';

// SCEN-703: 未提出者へのリマインダー送信で、報告者IDが空の場合にエラーメッセージが表示される。
//
// panels/scr-1790147095974.html（日報確認・管理画面）の「未提出者・リマインダー」タブには、仕様が想定する
// 「リマインダー送信ダイアログ」や「報告者IDフィールド」（テキスト入力欄）が存在しない。実際の実装では、
// 未提出者一覧（#rm-missing-tbody）の行のチェックボックス（.rm-missing-checkbox）で対象者を選択し、
// 「選択した未提出者にリマインダーを送信」ボタン（#rm-send-reminder-btn）を押す方式になっている。
// このボタンのクリックハンドラ（AIVIC_PAGE_INIT_JS 内）では、チェックボックスが1件も選択されていない場合、
// showToast('リマインダーを送信する未提出者を選択してください。') が呼ばれるのみで、仕様が期待する
// 「報告者IDは必須です」という文言のエラーメッセージは表示されない。また呼び出し窓口 sendReminderEmail に
// 相当する処理はこの画面から直接観測できない（UI内部処理としてのみ実装され、ネットワーク呼び出しや
// APIとして分離されていない）ため、送信されなかったことは「メール送信履歴」タブ（#rm-mail-tbody）の
// 件数が変化しないことで代替確認している。本テストは仕様の期待結果の文言どおりに検証を記述したが、
// 上記の理由により現状のサンプル実装では成立しない可能性が高い。詳細は .aivic/batches/23/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者IDが空の場合、リマインダー送信でエラーメッセージが表示される', async ({ page }) => {
  // 日報確認・管理画面を開く
  await login(page, 'admin_scen703');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者一覧から「リマインダー送信」機能を呼び出す（リマインダー送信ダイアログに相当する
  // 「未提出者・リマインダー」タブを開く）
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  await expect(page.locator('[data-panel="reminder"]')).toBeVisible();

  // 送信前のメール送信履歴の件数を記録しておく（sendReminderEmail が呼ばれたかどうかの代替確認用）
  await page.getByText('メール送信履歴', { exact: true }).click();
  const mailRowsBefore = await page.locator('#rm-mail-tbody tr').count();
  await page.getByText('未提出者・リマインダー', { exact: true }).click();

  // 報告者IDフィールドを空のまま（チェックボックスを何も選択せず）にして「送信」ボタンをクリックする
  let dialogAppeared = false;
  page.once('dialog', (dialog) => {
    dialogAppeared = true;
    dialog.dismiss();
  });
  await page.locator('#rm-send-reminder-btn').click();

  // 画面の反応を確認する:
  // 報告者IDが空の場合、エラーメッセージ「報告者IDは必須です」が画面に表示される
  await expect(page.getByText('報告者IDは必須です')).toBeVisible();

  // 送信確認ダイアログ（sendReminderEmail の呼び出しにつながる操作）は発生していない
  expect(dialogAppeared).toBe(false);

  // sendReminderEmail の呼び出しが発生せず、送信処理が中断されている
  // （メール送信履歴の件数が変化していないことで代替確認する）
  await page.getByText('メール送信履歴', { exact: true }).click();
  const mailRowsAfter = await page.locator('#rm-mail-tbody tr').count();
  expect(mailRowsAfter).toBe(mailRowsBefore);
});
