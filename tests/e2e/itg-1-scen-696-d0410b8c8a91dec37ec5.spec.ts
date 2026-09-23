import { test, expect, type Page } from '@playwright/test';

// SCEN-696: 超過時間が30分以内の未提出者に対して催促の優先度が「低」と判定される
//
// panels/scr-1790147095974.html の「未提出者・リマインダー」タブ（#rm-missing-tbody）は
// 報告者名・対象日付・最終リマインダー送信日時の3項目のみを描画し、超過時間や催促優先度という
// 概念自体が画面のどこにも存在しない（テーブル列にも詳細モーダルにも「催促優先度」列や「超過時間」列は
// ない）。詳細設計 src/logic/non-submission-prompt-decision.ts の calculatePromptPriority
// は超過時間から優先度（低・中・高）を算出する業務ロジックを定義しているが、この画面の
// AIVIC_PAGE_INIT_JS はそれを呼び出しておらず、UIに反映する実装は存在しない。検知ログ
// （#rm-log-tbody）・メール送信履歴（#rm-mail-tbody）にも優先度を示す列や文言はない。
// この食い違いは .aivic/batches/21/unresolved.md に記録する。本テストは仕様の文言どおりに
// 検証を記述する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('超過時間が30分以内の未提出者に対して催促の優先度が「低」と判定される', async ({ page }) => {
  // 手順1: 日報確認・管理画面にログインする
  await login(page, 'leader_scen696');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順2: 定時自動検知により、提出期限を超過した未提出者の一覧を表示させる
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  await expect(page.locator('#rm-detect-status')).not.toBeEmpty();

  // 手順3: 未提出者一覧から、超過時間が30分以内（例：超過時間 15分）のユーザーを確認する
  // 画面には超過時間を示す列が存在しないため、代替として未提出者一覧の先頭行（高橋 次郎）を対象とする。
  const targetRow = page.locator('#rm-missing-tbody tr', { hasText: '高橋 次郎' });
  await expect(targetRow).toBeVisible();
  await expect(page.locator('.rm-table th', { hasText: '超過時間' })).toBeVisible();

  // 手順4: 該当ユーザーに対してリマインダー送信機能を実行する
  await targetRow.locator('.rm-missing-checkbox').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 手順5: 未提出者一覧を確認し、該当ユーザー行の催促優先度カラムを表示させる
  await expect(page.locator('.rm-table th', { hasText: '催促優先度' })).toBeVisible();

  // 期待結果: 該当ユーザー行の催促優先度カラムに「低」と表示されること
  await expect(targetRow.locator('.rm-priority-value')).toHaveText('低');

  // 期待結果: リマインダー送信履歴またはログに、該当ユーザーへの送信記録が「優先度：低」として記録されていること
  await page.locator('.rm-tab[data-tab="log"]').click();
  const logRow = page.locator('#rm-log-tbody tr', { hasText: '高橋 次郎' });
  await expect(logRow).toContainText('優先度：低');
});
