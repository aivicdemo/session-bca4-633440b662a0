import { test, expect, type Page } from '@playwright/test';

// SCEN-701: 過去5日間の提出率が80%以上の未提出者に対して推奨アクションが「様子見」に変更される
//
// panels/scr-1790147095974.html には、報告者ごとの「過去5日間の提出率」を確認できるUIが存在しない
// （「提出済み日報」タブは報告者名・報告日等で絞り込んだ一覧を表示するのみで、提出率という集計値は
// どこにも表示されない）。また「対象ユーザーを本日の日報未提出状態に設定する」操作や、
// 「定時自動検知ロジックを手動トリガーする」操作に対応するUI要素も存在しない（自動検知ステータス
// #rm-detect-status は固定文言を表示するのみで、手動トリガー用のボタンはない）。さらに
// 「未提出者・リマインダー」タブの一覧（#rm-missing-tbody）には「推奨アクション」列自体が存在しない。
// 本テストは仕様の文言に忠実に、未提出者一覧から対象ユーザー「渡辺 恵子」の行を選択し、推奨アクション列に
// 「様子見」と表示され、「督促」「即時連絡」等の他の値が表示されないことを検証する形で記述したが、
// 前提操作（提出率確認・未提出状態設定・手動トリガー）を実施する手段がなく、「推奨アクション」列も
// 実装されていないため、現状のサンプル実装では失敗する可能性が高い。詳細は
// .aivic/batches/22/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('過去5日間の提出率が80%以上の未提出者に対して推奨アクションが「様子見」に変更される', async ({ page }) => {
  // テスト環境の日報確認・管理画面にログインする
  await login(page, 'leader_scen701');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 対象ユーザーの過去5日間の日報提出履歴を確認し、提出率が80%以上であることを手動で検証する
  // → 画面上に提出率を確認できるUIが存在しないため、対象ユーザー「渡辺 恵子」が過去5日間の提出率
  //   80%以上を満たす前提として扱う。

  // 対象ユーザーを本日の日報未提出状態に設定する
  // → 対応するUI操作が存在しないため、未提出者一覧に対象ユーザーが表示されていることで代替確認する。

  // 日報確認・管理画面で定時自動検知ロジックを手動トリガーする
  // → 対応するUI操作（手動トリガーボタン等）が存在しない。

  // 日報確認・管理画面の未提出者一覧を表示する
  const reminderTab = page.locator('.rm-tab[data-tab="reminder"]');
  await reminderTab.click();
  await expect(reminderTab).toHaveClass(/is-active/);
  const missingRows = page.locator('#rm-missing-tbody tr');
  await expect(missingRows).not.toHaveCount(0);

  // 対象ユーザーの行を確認し、推奨アクション列の表示値を目視で確認する
  const targetRow = missingRows.filter({ hasText: '渡辺 恵子' });
  await expect(targetRow).toBeVisible();

  // 対象ユーザーの推奨アクション列に「様子見」と表示されること。
  await expect(targetRow).toContainText('様子見');

  // その他のアクション値（例：「督促」「即時連絡」）は表示されないこと。
  await expect(targetRow).not.toContainText('督促');
  await expect(targetRow).not.toContainText('即時連絡');
});
