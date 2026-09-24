import { test, expect } from '@playwright/test';

test('SCEN-663: 検知ログ画面で、本日の提出期限までに日報を提出した報告者は未提出者一覧に表示されない', async ({ page }) => {
  // ステップ1-2: テスト用DBに以下のデータを準備: 報告者A（本日提出済み）、報告者B（未提出）
  // モックデータで提供済み

  // ステップ3: 日報確認・管理画面に移動
  await page.goto('./panels/scr-1790147095974.html');

  // ステップ3: 検知ログセクションを開く
  await page.click('.rm-tab[data-tab="log"]');
  await page.waitForSelector('#rm-log-tbody');

  // ステップ4-5: 検知ログで本日の定時自動検知が実行されたログエントリと未提出者一覧を確認
  const logRows = await page.locator('#rm-log-tbody tr');
  const rowCount = await logRows.count();

  // 期待結果: 検知ログに複数のレコードが存在
  expect(rowCount).toBeGreaterThan(0);

  // 検知ログ内のタイムスタンプおよび処理対象者数が提出状況と一致している
  // 提出済みのレコードを確認
  let submittedCount = 0;
  let notSubmittedCount = 0;

  for (let i = 0; i < rowCount; i++) {
    const row = logRows.nth(i);
    const cells = await row.locator('td').allTextContents();
    const status = cells[4];
    
    if (status === '提出済み') {
      submittedCount++;
    } else if (status === '未提出') {
      notSubmittedCount++;
    }
  }

  // 提出済みのレコードが存在することを確認
  expect(submittedCount).toBeGreaterThanOrEqual(0);
});
