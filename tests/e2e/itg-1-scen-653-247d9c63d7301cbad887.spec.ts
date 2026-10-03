import { test, expect } from '@playwright/test';

test('SCEN-653: 日報データベースが一時的に取得できないとき、警告メッセージが表示される', async ({ page }) => {
  // テスト環境で日報確認・管理画面にアクセスする
  await page.goto('/panels/scr-1790147095974.html');

  // 日報データベースが一時的に取得できない状態をシミュレート
  // APIリクエストをインターセプトしてエラーを返す
  await page.route('**/api/**', (route) => {
    route.abort('failed');
  });

  // 未提出者検知ボタンをクリックして検知処理を実行する
  // 画面初期化後、#rm-detect-status が表示される
  await page.waitForSelector('#rm-detect-status', { timeout: 10000 });

  // 警告メッセージ「日報データを取得できません。しばらく待ってから再度確認してください」が表示されるまで最大10秒待機
  const warningMessage = page.locator(
    'text=/日報データを取得できません.*しばらく待ってから再度確認してください/',
  );

  await expect(warningMessage).toBeVisible({ timeout: 10000 });

  // 未提出者一覧は表示されないことを確認
  const missingTbody = page.locator('#rm-missing-tbody');
  const missingRows = await missingTbody.locator('tbody tr:not(.rm-empty-row)').count();
  expect(missingRows).toBe(0);
});
