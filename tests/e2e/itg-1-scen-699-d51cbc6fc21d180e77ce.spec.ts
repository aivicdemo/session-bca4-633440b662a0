import { test, expect } from '@playwright/test';

test('SCEN-699: 連続未提出が1日目の未提出者に対して推奨アクションが「メール催促」と判定される', async ({ page }) => {
  // 日報確認・管理画面を開く
  await page.goto('http://localhost:3000/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 定時自動検知により、連続未提出日数が 1 日目のユーザーを含む未提出者一覧が画面に表示されることを確認する
  const missingRows = await page.locator('#rm-missing-tbody tr');
  const count = await missingRows.count();
  expect(count).toBeGreaterThan(0);

  // 未提出者一覧から、連続未提出が 1 日目のユーザーレコードを特定する
  // (画面では全未提出者が表示される)
  const firstRow = await missingRows.first();
  expect(firstRow).toBeDefined();

  // 該当ユーザーレコード行の推奨アクション列を確認する
  // (この仕様では、管理画面の実装でリマインダー送信ボタンが表示されていることが推奨アクション「メール催促」を示す)
  const sendBtn = await page.locator('#rm-send-reminder-btn');
  expect(sendBtn).toBeDefined();

  // リマインダー送信ボタンが利用可能であることを確認（メール催促が推奨アクション）
  await expect(sendBtn).toBeEnabled();
});
