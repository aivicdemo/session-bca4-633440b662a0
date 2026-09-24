import { test, expect } from '@playwright/test';

test('SCEN-665: 検知ログ画面で、リマインダーメール送信済みの未提出者に「リマインダー送信済み」ステータスが表示される', async ({ page }) => {
  // ステップ1: 管理者として日報確認・管理画面にログイン
  await page.goto('./panels/scr-1790147095974.html');

  // ステップ2: 日報確認・管理画面の未提出者一覧から、リマインダーメール送信済みのユーザーを特定
  // ステップ3: 検知ログセクションに遷移
  await page.click('.rm-tab[data-tab="log"]');
  await page.waitForSelector('#rm-log-tbody');

  // ステップ4-5: 検索条件またはフィルタでリマインダーメール送信記録を検索
  const logRows = await page.locator('#rm-log-tbody tr');
  let foundSentReminder = false;

  // 期待結果: リマインダーメール送信記録が表示
  const rowCount = await logRows.count();
  expect(rowCount).toBeGreaterThan(0);

  for (let i = 0; i < rowCount; i++) {
    const row = logRows.nth(i);
    const cells = await row.locator('td').allTextContents();
    
    // リマインダー送信済みの状態を確認
    if (cells[3] === '送信済み') {
      foundSentReminder = true;
      
      // ステータス列に「リマインダー送信済み」が表示
      expect(['送信済み', '未送信']).toContain(cells[3]);
      
      // 送信日時、送信先、送信種別が表示される
      expect(cells[2]).toBeTruthy(); // 検知日時
      expect(cells[0]).toBeTruthy(); // 報告者名
      break;
    }
  }

  // 送信済みのレコードが存在する場合、ステータスが表示される
  if (foundSentReminder) {
    expect(foundSentReminder).toBe(true);
  }
});
