import { test, expect, type Page } from '@playwright/test';

// SCEN-651: 報告者IDが空または不正な形式のとき、エラーメッセージ「報告者情報が不正です。管理者に確認して
// ください」が表示される。
//
// 以下の食い違いを .aivic/batches/11/unresolved.md に記録する。
// - 手順「未提出者検知機能の実行をトリガーする（定時検知実行ボタンまたはスケジュール実行を待機）」に対応する
//   トリガーボタンは panels/scr-1790147095974.html に存在しない。本テストは実在する「未提出者・リマインダー」
//   タブを開くことでこの手順に代替する。
// - 「システムが未提出者データから報告者IDの妥当性チェックを実行し...処理する」に相当するバリデーション処理も
//   画面側には実装されておらず、報告者IDが空・null・不正形式のレコードを検知・処理する仕組みは存在しない。
// - 期待結果に記載の「EmailNotificationService.sendNonSubmissionAlert」は、詳細設計
//   （src/logic/email-notification-management.ts）に存在するオペレーション名（sendNonSubmissionPromptNotification）
//   と一致しない。仕様文言と詳細設計の食い違いであり、テストコードでは詳細設計側の名称を参照できない。
// - 「管理画面の未提出者一覧には『通知未送信』フラグが立てられ」に対応する表示（列やバッジ）も存在しない
//   （#rm-missing-tbody の列はチェックボックス・報告者名・対象日付・最終リマインダー送信日時のみ）。
// - 「内部ログに送信失敗が記録される」を確認できる UI（ログビューア等）も存在しない。本テストではブラウザの
//   コンソールログ出力を代替の確認手段として監視する。
// 本テストは仕様の期待結果の文言に忠実に、エラーメッセージ表示・通知未送信フラグ・内部ログ記録を検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者IDが不正な未提出者データの処理時にエラーメッセージと通知未送信フラグが表示される', async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(msg.text());
  });

  // テスト環境でPlaywrightブラウザコンテキストを初期化し、日報確認・管理画面へアクセスする。
  await login(page, 'admin_scen651');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者検知機能の実行をトリガーする（定時検知実行ボタンに相当する未提出者・リマインダータブを開く）。
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // システムが未提出者データから報告者IDの妥当性チェックを実行し、報告者IDが空または不正な形式のレコードを
  // 処理する。エラーハンドリング処理が発動し、画面にエラーメッセージが表示されるまで待機する。
  const errorMessage = page.locator('.rm-panel[data-panel="reminder"]').getByText('報告者情報が不正です。管理者に確認してください');
  await expect(errorMessage).toBeVisible();

  // 表示されたエラーメッセージの内容を innerText で取得し、検証対象文言と照合する。
  const errorText = await errorMessage.innerText();
  expect(errorText).toBe('報告者情報が不正です。管理者に確認してください');

  // 管理画面の未提出者一覧には「通知未送信」フラグが立てられる。
  await expect(page.locator('#rm-missing-tbody')).toContainText('通知未送信');

  // 内部ログに送信失敗が記録される（コンソールログ出力を代替の確認手段とする）。
  expect(consoleMessages.some((m) => m.includes('送信失敗'))).toBe(true);
});
