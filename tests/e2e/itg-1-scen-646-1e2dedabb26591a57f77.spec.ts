import { test, expect, type Page } from '@playwright/test';

// SCEN-646: 未提出者一覧が表示されたとき、期限超過時間に基づいて催促の優先度（低・中・高）と推奨アクション
// （直接指示・メール催促・様子見）が判定されて表示される。
//
// panels/scr-1790147095974.html の「未提出者・リマインダー」タブ（#rm-missing-tbody）には、詳細設計
// （non-submission-prompt-decision.ts の judgePromptNecessityAndMethod / calculatePromptPriority /
// determinePromptMethod）が定める『優先度』列・『推奨アクション』列に相当する列が存在しない。実際の列は
// チェックボックス・報告者名・対象日付・最終リマインダー送信日時の4列のみで、期限超過時間の算出も優先度・
// 推奨アクションの判定結果の表示も実装されていない（ui-reference.md の visibleTexts にも「優先度」
// 「推奨アクション」「直接指示」「メール催促」「様子見」に該当する文言はない）。この食い違いは
// .aivic/batches/11/unresolved.md に記録する。本テストは仕様の期待結果の文言どおり『優先度』列・
// 『推奨アクション』列の存在とその値を検証するが、上記の理由から現状のサンプル実装では成立しない。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('未提出者一覧の各行に優先度と推奨アクションが期限超過時間に応じて表示される', async ({ page }) => {
  // テスト対象者（管理者）が日報確認・管理画面にログインする。
  await login(page, 'admin_scen646');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 画面の未提出者一覧セクションを表示する。
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 未提出者一覧が描画されるのを待ち、テーブル行として各未提出者が表示されることを確認する。
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 各未提出者行に『優先度』列と『推奨アクション』列が表示されていることを確認する。
  const headerCells = page.locator('[data-panel="reminder"] table thead th');
  const headerTexts = await headerCells.allTextContents();
  const priorityIndex = headerTexts.indexOf('優先度');
  const recommendedActionIndex = headerTexts.indexOf('推奨アクション');
  expect(priorityIndex).toBeGreaterThanOrEqual(0);
  expect(recommendedActionIndex).toBeGreaterThanOrEqual(0);

  // 画面上に表示された複数の未提出者（期限超過時間が異なる者）の行を確認し、各行の優先度と推奨アクション値を検証する。
  for (let i = 0; i < rowCount; i++) {
    const cells = rows.nth(i).locator('td');
    await expect(cells.nth(priorityIndex)).toContainText(/低|中|高/);
    await expect(cells.nth(recommendedActionIndex)).toContainText(/直接指示|メール催促|様子見/);
  }
});
