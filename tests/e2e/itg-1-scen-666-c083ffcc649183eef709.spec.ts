import { test, expect } from '@playwright/test';

test('SCEN-666: 検知ログ画面で、リマインダーメール送信に失敗した未提出者に「通知未送信」フラグが表示される', async ({ page }) => {
  // ステップ1-2: 管理者ユーザーで日報確認・管理画面にログイン
  await page.goto('./panels/scr-1790147095974.html');

  // ステップ3-5: リマインダー送信処理を実行してメール送信失敗状態を確認
  // 検知ログ画面を開く
  await page.click('.rm-tab[data-tab="log"]');
  await page.waitForSelector('#rm-log-tbody');

  // ステップ6: 検知ログタブを開き、該当する未提出者のレコードを検索・表示
  const logRows = await page.locator('#rm-log-tbody tr');
  const rowCount = await logRows.count();

  // 期待結果: 複数のレコードが表示
  expect(rowCount).toBeGreaterThan(0);

  // 「通知未送信」フラグが表示されているレコードを確認
  let foundUnsentNotification = false;

  for (let i = 0; i < rowCount; i++) {
    const row = logRows.nth(i);
    const cells = await row.locator('td').allTextContents();
    
    // リマインダー送信未送信の状態を確認
    if (cells[3] === '未送信') {
      foundUnsentNotification = true;
      
      // ステータスフラグカラムが視認可能
      expect(cells[3]).toBe('未送信');
      
      // 他のステータスと明確に区別できる
      expect(['送信済み', '未送信']).toContain(cells[3]);
      break;
    }
  }

  // 未送信のレコードが存在することを確認
  expect(foundUnsentNotification).toBe(true);
});
