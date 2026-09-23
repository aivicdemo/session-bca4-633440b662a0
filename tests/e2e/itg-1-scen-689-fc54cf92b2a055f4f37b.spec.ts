import { test, expect, type Page } from '@playwright/test';

// SCEN-689: リーダーがリマインダー送信権限を持たない場合、操作が拒否される。
//
// login.html はどの入力値でもログインでき、ユーザーの役割（リーダー権限の有無）を区別する実装がない
// （過去バッチ5 SCEN-624、バッチ13 unresolved.md でも同様の指摘あり）。panels/scr-1790147095974.html の
// 「選択した未提出者にリマインダーを送信」ボタン（#rm-send-reminder-btn）にも権限チェックのロジックは存在せず、
// 常に有効化されている。ボタン押下後は window.confirm による確認ダイアログのみが表示され、「権限がありません」
// 等のエラーメッセージは表示されない。また、呼び出し窓口 sendReminderEmail に相当する処理はこのサンプル画面から
// 直接観測できない（ネットワーク呼び出しやAPIエンドポイントとして分離されておらず、UIの内部処理として実装されて
// いるため、E2Eテストの範囲でその呼び出し有無を検証する手段がない）。本テストは仕様の期待結果の文言どおりに
// 検証を記述したが、上記の理由により現状のサンプル実装では成立しない可能性が高い。詳細は
// .aivic/batches/19/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダー権限を持たないユーザーがリマインダー送信を実行しようとすると拒否される', async ({ page }) => {
  // テストユーザー（リーダー権限なし）で日報確認・管理画面にログインする
  await login(page, 'no_leader_role_scen689');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者一覧から対象の報告者を選択する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);
  const targetRow = rows.first();
  await targetRow.locator('.rm-missing-checkbox').check();

  const sendBtn = page.locator('#rm-send-reminder-btn');

  // 「リマインダー送信」ボタンをクリックする
  // 画面の応答を観察する
  let dialogMessage: string | null = null;
  page.once('dialog', (dialog) => {
    dialogMessage = dialog.message();
    dialog.dismiss();
  });

  const isDisabled = await sendBtn.isDisabled();
  if (!isDisabled) {
    await sendBtn.click();
  }

  // リマインダー送信ボタンが無効化されているか、クリック後に「権限がありません」または
  // 「この操作は許可されていません」というエラーメッセージがアラート表示される
  if (!isDisabled) {
    expect(dialogMessage).toMatch(/権限がありません|この操作は許可されていません/);
  } else {
    expect(isDisabled).toBe(true);
  }

  // 画面遷移は発生せず、未提出者一覧画面のままである
  await expect(page).toHaveURL(/panels\/scr-1790147095974\.html/);
  await expect(page.locator('#rm-missing-tbody')).toBeVisible();
});
