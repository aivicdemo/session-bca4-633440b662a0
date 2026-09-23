import { test, expect, type Page } from '@playwright/test';

// SCEN-658: チームに報告者が1名も登録されていないとき、警告メッセージ「チームに報告者が登録されていません」が
// 表示される。
//
// panels/scr-1790147095974.html / window.AIVIC_TABLES にはユーザー・日報・日報リマインダー設定・日報未提出者
// 検知ログ・メール送信履歴の5テーブルのみが定義されており、ユーザーマスタから報告者を削除・未割り当てにする
// ための管理UI・APIは存在しない（過去バッチのSCEN-629・SCEN-634でも同様の指摘あり）。「未提出者検知機能を
// 実行するトリガー（定時検知の手動実行ボタンなど）」も画面上に存在せず、#rm-detect-status はハードコードされた
// 固定文字列を表示するのみである。未提出者一覧（missing 配列）は3件が常に固定表示され、報告者の状態に関わらず
// 変化しない。期待結果の「チームに報告者が登録されていません」という警告メッセージ・表示領域も画面のどこにも
// 実装されていない。本テストは、画面上でアクセス可能な操作に代替しつつ期待結果の文言どおりの検証を記述したが、
// 現状のサンプル実装では成立しない可能性が高い。詳細は .aivic/batches/13/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('チームに報告者が1名も登録されていないとき、警告メッセージが表示される', async ({ page }) => {
  // テスト環境の日報確認・管理画面にアクセスする
  await login(page, 'admin_scen658');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // ユーザーマスタから現在のチームに割り当てられた報告者を確認し、全員を削除または未割り当て状態にする
  await page.getByText('ユーザーマスタ', { exact: true }).click();
  const reporterRows = page.locator('#um-tbody tr');
  const reporterCount = await reporterRows.count();
  for (let i = 0; i < reporterCount; i += 1) {
    await page.locator('#um-tbody tr').first().getByText('削除', { exact: true }).click();
  }

  // 日報確認・管理画面の未提出者検知機能を実行するトリガー（定時検知の手動実行ボタンなど）を操作する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  await page.getByRole('button', { name: '未提出者検知を実行' }).click();

  // 画面が検知処理を完了するまで待機する
  await page.waitForLoadState('networkidle');

  // 警告メッセージ表示領域に「チームに報告者が登録されていません」というメッセージが、赤色または警告アイコン付き
  // で視認可能な形式で表示される
  await expect(page.getByText('チームに報告者が登録されていません')).toBeVisible();
});
