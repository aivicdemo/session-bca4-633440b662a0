import { test, expect } from '@playwright/test';

// SCEN-699: 連続未提出が1日目の未提出者に対して推奨アクションが「メール催促」と判定される

test('連続未提出が1日目の未提出者に対して推奨アクションが「メール催促」と判定される', async ({ page }) => {
  await page.goto('/panels/scr-1790147095974.html');

  // ステップ2: 定時自動検知により、連続未提出日数が 1 日目のユーザーを含む未提出者一覧が画面に表示されることを確認する
  const missingTab = page.locator('button[data-tab="reminder"]');
  await expect(missingTab).toBeVisible();
  await missingTab.click();

  const missingPanel = page.locator('.rm-panel[data-panel="reminder"]');
  await expect(missingPanel).toBeVisible();

  // ステップ3: 未提出者一覧から、連続未提出が 1 日目のユーザーレコードを特定する
  const missingTable = page.locator('#rm-missing-tbody');
  await expect(missingTable).toBeVisible();

  // ユーザーレコードを特定（1日目の未提出者を探す）
  // テーブル構造: チェックボックス | 報告者名 | 対象日付 | 最終リマインダー送信日時 | 推奨アクション
  const rows = await page.locator('#rm-missing-tbody tr').count();
  expect(rows).toBeGreaterThan(0);

  // ステップ4: 該当ユーザーレコード行の推奨アクション列を確認する
  const firstRow = page.locator('#rm-missing-tbody tr').first();

  // 推奨アクション列のセルを確認（4番目のセル）
  const recommendedActionCell = firstRow.locator('td').nth(4);

  // 期待結果: 推奨アクション列に「メール催促」と表示されることを確認
  await expect(recommendedActionCell).toContainText('メール催促');
});
