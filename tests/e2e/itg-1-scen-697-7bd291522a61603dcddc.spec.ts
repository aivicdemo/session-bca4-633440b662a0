import { test, expect, type Page } from '@playwright/test';

// SCEN-697: 超過時間が30分を超えて120分以内の未提出者に対して催促の優先度が「中」と判定される
//
// panels/scr-1790147095974.html の「リマインダー設定管理」モーダル（#rm-settings-modal）は
// 有効フラグ・送信時刻・送信曜日・送信方法の4項目のみで構成され、催促優先度の判定ルール
// （超過時間の閾値と優先度の対応）を確認・設定する項目は存在しない。「未提出者・リマインダー」タブにも
// 超過時間で検索・絞り込みする入力欄はない（フィルター行自体が存在せず、チェックボックス選択と
// 送信ボタンのみ）。また未提出者一覧（#rm-missing-tbody）には「リマインダー送信済み」という
// ステータス表示はなく、最終リマインダー送信日時の列に日時文字列が入るのみである。
// この食い違いは .aivic/batches/21/unresolved.md に記録する。本テストは仕様の文言どおりに
// 検証を記述する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('超過時間が30分を超えて120分以内の未提出者に対して催促の優先度が「中」と判定される', async ({ page }) => {
  // 手順1: 日報確認・管理画面にログインする
  await login(page, 'leader_scen697');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 手順2: リマインダー設定管理で催促優先度判定ルールが「30分超過～120分以内 = 優先度：中」に
  // 設定されていることを確認する
  await page.locator('#rm-settings-btn').click();
  await expect(page.locator('#rm-settings-modal')).toContainText('30分超過～120分以内');
  await expect(page.locator('#rm-settings-modal')).toContainText('優先度：中');
  await page.locator('#rm-settings-cancel').click();

  // 手順3: 未提出者一覧検索条件を「超過時間：30分超過～120分以内」に指定して検索を実行する
  const overdueFilter = page.getByLabel('超過時間');
  await overdueFilter.selectOption('30分超過～120分以内');
  await page.getByRole('button', { name: '検索' }).click();

  // 手順4: 検索結果に表示された未提出者のいずれか1件を選択する
  const targetRow = page.locator('#rm-missing-tbody tr').first();
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-missing-checkbox').check();

  // 手順5: 未提出者に対してリマインダー通知を送信するボタンをクリックする
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 手順6: 管理画面の該当ユーザーの行に「リマインダー送信済み」ステータスと送信時刻が表示されることを確認する
  await expect(targetRow).toContainText('リマインダー送信済み');
  await expect(targetRow.locator('.rm-sent-at')).not.toBeEmpty();
});
