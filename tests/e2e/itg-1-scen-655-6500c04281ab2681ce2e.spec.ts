import { test, expect, type Page } from '@playwright/test';

// SCEN-655: リーダーのメールアドレスの形式が無効なとき、メール通知が送信されず「通知送信失敗」フラグが
// 管理画面に表示される。
//
// panels/scr-1790147095974.html には「リーダーのメールアドレス」を設定・変更するための画面・入力欄が一切存在
// しない（リマインダー設定管理モーダル #rm-settings-modal は送信時刻・送信曜日・送信方法のみを保持し、メール
// アドレスの項目を持たない）。また「未提出者検知機能をトリガー実行する」ための手動実行ボタンも存在せず、
// #rm-detect-status は window.AIVIC_PAGE_INIT_JS 内にハードコードされた固定文字列（最終検知: 2026-09-23 09:00）
// を表示するだけである。呼び出し窓口 sendReminderEmail に相当する処理は画面からは呼び出せず、「選択した未提出者に
// リマインダーを送信」ボタン（#rm-send-reminder-btn）押下時の処理は常に mailHistory へ送信ステータス「成功」の
// レコードを追加するのみで、メールアドレス形式によって送信結果が変化する分岐は実装されていない。未提出者一覧
// （#rm-missing-tbody）の列もチェックボックス・報告者名・対象日付・最終リマインダー送信日時の4列のみであり、
// 「通知送信失敗」フラグを表示する列・アイコンは存在しない。本テストは、これらの前提操作を画面上で可能な範囲まで
// 代替しつつ、期待結果の文言（「通知送信失敗」または「送信失敗」）どおりの検証を記述したが、現状のサンプル実装
// では成立しない可能性が高い。詳細は .aivic/batches/13/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーのメールアドレス形式が無効なとき、未提出者一覧に通知送信失敗フラグが表示される', async ({ page }) => {
  // 管理者ユーザーで日報確認・管理画面にログインする
  await login(page, 'admin_scen655');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者・リマインダータブを開き、未提出者一覧を確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();
  const targetRow = rows.first();

  // 定時自動検知による未提出者検知機能をトリガー実行する（相当する操作として、対象行を選択しリマインダー送信を行う）
  await targetRow.locator('.rm-missing-checkbox').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 管理画面をリロードして未提出者一覧テーブルの当該行を再確認する
  await page.reload();
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const reloadedRow = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)').first();

  // 未提出者一覧テーブルの該当行に「通知送信失敗」フラグ（テキストまたはアイコン、例：「送信失敗」表記）が
  // 視認可能な状態で表示される
  await expect(reloadedRow.getByText(/通知送信失敗|送信失敗/)).toBeVisible();
});
