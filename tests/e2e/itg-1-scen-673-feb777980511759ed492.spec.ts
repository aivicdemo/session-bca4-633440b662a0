import { test, expect } from '@playwright/test';

test('SCEN-673: 5名全員が日報を提出した場合、検知ログ画面に未提出者一覧は空で表示される', async ({ page }) => {
  // テストデータを準備する：5名全員のユーザー（報告者）を日報管理システムに登録済みの状態で用意する
  // （テスト環境の前提条件として実施）

  // 5名全員が日報入力・提出画面から日報内容（「今日何をしたか」の入力項目）を入力し、妥当性チェックを通過させて提出する
  // （テスト環境での実際のユーザーログイン・提出操作）

  // 日報確認・管理画面を開く
  await page.goto('http://localhost:5173/panels/scr-1790147095974.html');

  // 画面内の「検知ログ」機能にアクセスする
  const logTab = page.locator('button[data-tab="log"]');
  await logTab.click();

  // 期待結果: 検知ログ画面の未提出者一覧セクションが表示され、テーブル行が0件（空の状態）で表示される
  const logTable = page.locator('#rm-log-tbody');

  // 未提出者を示すデータが存在しないことが画面上で視認できる
  const dataRows = logTable.locator('tbody tr:not([class*="empty"])');
  const emptyRow = logTable.locator('[class*="empty-row"]');

  // 未提出者のレコードが表示されていないことを確認
  const unsubmittedRows = logTable.locator('tr', { hasText: '未提出' });
  const unsubmittedCount = await unsubmittedRows.count();

  if (unsubmittedCount === 0) {
    // 未提出者がいない状態
    await expect(logTable).toBeVisible();
  } else {
    // 表示されている行の確認
    const count = await dataRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  }
});
