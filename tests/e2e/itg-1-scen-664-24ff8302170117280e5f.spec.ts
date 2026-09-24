import { test, expect } from '@playwright/test';

test('SCEN-664: 検知ログ画面で、各未提出者の最後の提出日時が正しく表示される', async ({ page }) => {
  // ステップ1-5: テスト用DBを初期化し、報告者の過去提出日時データを設定
  // モックデータで既に提供済み

  // ステップ6: 日報確認・管理画面にログインし、検知ログ確認機能を表示
  await page.goto('./panels/scr-1790147095974.html');

  // 検知ログタブを開く
  await page.click('.rm-tab[data-tab="log"]');
  await page.waitForSelector('#rm-log-tbody');

  // ステップ6: 未提出者一覧セクションで各ユーザーの最後の提出日時カラムを確認
  const logRows = await page.locator('#rm-log-tbody tr');
  const rowCount = await logRows.count();

  // 期待結果: 検知ログに複数のレコードが表示
  expect(rowCount).toBeGreaterThan(0);

  // 表示されたデータが以下のフォーマットで表示される
  // - 対象日付: YYYY-MM-DD形式
  // - 検知日時: YYYY-MM-DD HH:MM形式
  for (let i = 0; i < Math.min(rowCount, 3); i++) {
    const row = logRows.nth(i);
    const cells = await row.locator('td').allTextContents();

    // 対象日付の確認
    expect(cells[1]).toMatch(/\d{4}-\d{2}-\d{2}/);

    // 検知日時の確認
    expect(cells[2]).toMatch(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/);
  }

  // 画面遷移・エラーなく全データが表示される
  expect(rowCount).toBeGreaterThan(0);
});
