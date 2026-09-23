import { test, expect, type Page } from '@playwright/test';

// SCEN-699: 連続未提出が1日目の未提出者に対して推奨アクションが「メール催促」と判定される
//
// panels/scr-1790147095974.html の「未提出者・リマインダー」タブ（#rm-missing-tbody）の列は
// チェックボックス・報告者名・対象日付・最終リマインダー送信日時の4列のみで、「推奨アクション」列は
// 存在しない。また未提出者データ（missing 配列）には「連続未提出日数」に相当する項目もなく、
// 未提出が何日目かを画面上で識別する手段がない。詳細設計上は
// src/logic/non-submission-prompt-decision.ts の judgePromptNecessityAndMethod が催促方法
// （メール・リマインダー・直接連絡）を判定する処理を持つが、これは screen_event
// 「scr-1790147095974:未提出者催促」に紐づくのみで、実際の画面には対応するUI（列・表示）が
// 実装されていない。
// 本テストは仕様の文言に忠実に、未提出者一覧が表示されることを確認した上で、最終リマインダー送信日時が
// 「未送信」（＝まだ一度も催促されていない＝連続未提出1日目に相当すると考えられる）である報告者「高橋 次郎」
// の行を対象として、推奨アクション列に「メール催促」と表示されることを検証する形で記述したが、
// 「推奨アクション」列自体が存在しないため、現状のサンプル実装では失敗する可能性が高い。
// 詳細は .aivic/batches/22/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('連続未提出が1日目の未提出者に対して推奨アクションが「メール催促」と判定される', async ({ page }) => {
  // 日報確認・管理画面を開く
  await login(page, 'leader_scen699');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const reminderTab = page.locator('.rm-tab[data-tab="reminder"]');
  await reminderTab.click();
  await expect(reminderTab).toHaveClass(/is-active/);

  // 定時自動検知により、連続未提出日数が1日目のユーザーを含む未提出者一覧が画面に表示されることを確認する
  await expect(page.locator('#rm-detect-status')).not.toBeEmpty();
  const missingRows = page.locator('#rm-missing-tbody tr');
  await expect(missingRows).not.toHaveCount(0);

  // 未提出者一覧から、連続未提出が1日目のユーザーレコードを特定する
  // （最終リマインダー送信日時が「未送信」＝一度も催促されていない報告者を1日目相当として扱う）
  const targetRow = missingRows.filter({ hasText: '高橋 次郎' });
  await expect(targetRow).toBeVisible();
  await expect(targetRow).toContainText('未送信');

  // 該当ユーザーレコード行の推奨アクション列を確認する
  // → 推奨アクション列に「メール催促」と表示される
  await expect(targetRow).toContainText('メール催促');
});
