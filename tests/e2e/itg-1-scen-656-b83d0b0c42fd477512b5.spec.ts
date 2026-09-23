import { test, expect, type Page } from '@playwright/test';

// SCEN-656: リーダーのメールアドレスがシステムで無効化されているとき、メール通知が送信されず警告が記録される。
//
// panels/scr-1790147095974.html には「システム設定メニュー」も「リーダーのメールアドレス設定画面」も存在しない
// （ui-reference.md の buttonTexts / visibleTexts にも該当する項目はない）。画面上部のナビゲーションは
// 「日報入力・提出」「日報確認・管理」の2画面のみで、システム管理者ロールと一般ユーザーの区別も login.html に
// 実装されていない（どの入力でもログイン可能）。「対象リーダーのメールアドレスの状態を無効化に変更し、保存する」
// 操作に対応するUI・APIも存在しない。「未提出検知の定時処理をトリガーする」ボタンも存在せず、検知ログ
// （#rm-log-tbody）はハードコードされた3件の履歴のみで、『リーダーのメールアドレス無効化のため送信スキップ』
// 『通知送信失敗』に相当する警告ログや、メール送信履歴（#rm-mail-tbody）の該当レコード欠落を確認する仕組みも
// 実装されていない。未提出者一覧にも「通知送信失敗」フラグを表示する列は存在しない（SCEN-655 と同様）。
// 本テストは、画面上でアクセス可能な範囲の操作に代替しつつ、期待結果の文言どおりの検証を記述したが、現状の
// サンプル実装では成立しない可能性が高い。詳細は .aivic/batches/13/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーのメールアドレスが無効化されているとき、検知ログに警告が記録され通知送信失敗フラグが立つ', async ({
  page,
}) => {
  // 日報確認・管理画面にシステム管理者ロールでログインする
  await login(page, 'sysadmin_scen656');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // システム設定メニューからリーダーのメールアドレス設定画面を開く
  await page.getByText('システム設定', { exact: true }).click();

  // 対象リーダーのメールアドレスの状態を「無効化」に変更し、保存する
  await page.getByText('無効化', { exact: true }).click();
  await page.getByText('保存', { exact: true }).click();

  // 未提出検知の定時処理をトリガーする
  await page.getByText('未提出者・リマインダー', { exact: true }).click();

  // 日報確認・管理画面の検知ログ・メール送信履歴セクションを確認し、当該検知処理のログエントリを探す
  await page.getByText('検知ログ', { exact: true }).click();
  const logRows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  await expect(logRows.first()).toBeVisible();

  // 検知ログに『リーダーのメールアドレス無効化のため送信スキップ』または『通知送信失敗』の警告ログが記録される
  await expect(page.getByText(/リーダーのメールアドレス無効化のため送信スキップ|通知送信失敗/)).toBeVisible();

  // メール送信履歴には該当するリーダーへの送信レコードが存在しない
  await page.getByText('メール送信履歴', { exact: true }).click();
  const mailRows = page.locator('#rm-mail-tbody tr:not(.rm-empty-row)');
  const mailCount = await mailRows.count();
  for (let i = 0; i < mailCount; i += 1) {
    await expect(mailRows.nth(i)).not.toContainText('sysadmin_scen656');
  }

  // 管理画面上に「通知送信失敗」フラグが立つ
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  await expect(page.locator('#rm-missing-tbody').getByText(/通知送信失敗|送信失敗/)).toBeVisible();
});
