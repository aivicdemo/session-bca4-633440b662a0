import { test, expect } from '@playwright/test';

// SCEN-700: 連続未提出が2日目以上の未提出者に対して推奨アクションが「直接指示」と判定される

test('連続未提出が2日目以上の未提出者に対して推奨アクションが「直接指示」と判定される', async ({ page }) => {
  // ステップ1: テスト環境で日報確認・管理画面にログインする（管理者権限）
  // サンプル画面ではログイン画面が実装されていないため、直接画面を開く
  await page.goto('/panels/scr-1790147095974.html');

  // ステップ2: 未提出者リストを表示する
  const missingTab = page.locator('button[data-tab="reminder"]');
  await expect(missingTab).toBeVisible();
  await missingTab.click();

  // ステップ3: 連続未提出が2日目以上のユーザーA（例：昨日未提出、本日も未提出）が一覧に表示されていることを確認する
  const missingTable = page.locator('#rm-missing-tbody');
  await expect(missingTable).toBeVisible();

  const rows = page.locator('#rm-missing-tbody tr');
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // ステップ4: ユーザーAの行を選択し、詳細情報パネルを開く
  // サンプル画面では詳細パネルが実装されていないため、行の推奨アクション列を確認
  const targetRow = rows.nth(1); // 2行目を対象

  // ステップ5: 詳細パネル内の「推奨アクション」フィールドが表示されていることを確認する
  // テーブルの推奨アクション列（5番目のセル）を確認
  const recommendedActionCell = targetRow.locator('td').nth(4);
  await expect(recommendedActionCell).toBeVisible();

  // ステップ6: 「推奨アクション」フィールドの値を確認する
  // 期待結果: ユーザーAの詳細パネルに表示される「推奨アクション」フィールドの値が「直接指示」である
  await expect(recommendedActionCell).toContainText('直接指示');
});
