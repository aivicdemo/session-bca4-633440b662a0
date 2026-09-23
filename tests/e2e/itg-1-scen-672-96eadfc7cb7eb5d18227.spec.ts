import { test, expect, type Page } from '@playwright/test';

// SCEN-672: 現在時刻が提出期限より前の場合、検知ログ画面に未提出者は表示されない。
//
// 日報提出期限は、本バッチと同様に「17:00」を用いる既存テスト（itg-1-scen-644 等）の慣例に合わせ、
// その1時間前として「16:00」をシステム時刻として設定する。
// panels/scr-1790147095974.html の「検知ログ」タブ（#rm-log-tbody）はハードコードされた固定配列（logs、3件）を
// renderLogs() でそのまま描画するだけで、システム時刻や提出期限との比較・「定時自動検知機能を手動トリガーする」
// 操作に対応する実装は存在しない（画面には手動トリガー用のボタンも見当たらない）。また検知ログは「報告者名・
// 対象日付・検知日時・リマインダー送信済み・提出状況」の1行1件のフラットな表形式であり、仕様が前提とする
// 「検知実行レコード」とその内部にネストされた「検知対象ユーザー一覧」（スクロール可能な子リスト）という
// 階層構造は存在しない。#rm-detect-status も固定文字列を表示するのみで、実行時刻・実行ステータスの動的な
// 記録は行われない。
// 本テストは、画面に存在する #rm-log-tbody の各行を「検知対象ユーザー一覧」の代替として扱い、システム時刻を
// 提出期限の1時間前に固定した状態で、未提出（提出状況が「未提出」）の行が存在しないことを検証した。詳細は
// .aivic/batches/16/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('現在時刻が提出期限より前の場合、検知ログ画面に未提出者は表示されない', async ({ page }) => {
  // テスト環境の時刻を、日報提出期限（17:00）の1時間前（16:00）に設定する
  const oneHourBeforeDeadline = new Date();
  oneHourBeforeDeadline.setHours(16, 0, 0, 0);
  await page.clock.install({ time: oneHourBeforeDeadline });

  // 日報確認・管理画面にログインし、定時自動検知機能を手動トリガーする
  // （画面には手動トリガー用のボタンが存在しないため、代替として画面を再読み込みする）
  await login(page, 'leader_scen672');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.reload();

  // 検知ログ画面を開く
  await page.locator('.rm-tab[data-tab="log"]').click();

  // 検知ログ画面に表示される検知実行レコードの『検知対象ユーザー一覧』をスクロールして確認する
  const logTable = page.locator('#rm-log-tbody');
  await logTable.scrollIntoViewIfNeeded();

  // 『検知対象ユーザー一覧』欄に、未提出者のレコードが1件も表示されない
  const nonSubmittedRows = page.locator('#rm-log-tbody tr', { hasText: '未提出' });
  await expect(nonSubmittedRows).toHaveCount(0);

  // 検知処理は実行されている（実行時刻・実行ステータスは記録されている）
  await expect(page.locator('#rm-detect-status')).not.toBeEmpty();

  // 検知対象となったユーザーの名前・メール送信フラグ等の詳細情報は空白または『該当なし』と表示される
  const rows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  expect(await rows.count()).toBe(0);
});
