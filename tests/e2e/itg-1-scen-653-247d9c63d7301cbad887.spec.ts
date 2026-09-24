import { test, expect } from '@playwright/test';

// SCEN-653: 日報データベースが一時的に取得できないとき、警告メッセージ
// 「日報データを取得できません。しばらく待ってから再度確認してください」が表示される

test('日報データベース取得エラー時に警告メッセージが表示される', async ({ page }) => {
  // テスト環境で日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // 未提出者検知ボタンをクリックして検知処理を実行
  // 画面内で検知を実行するトリガーを探す
  const detectButton = page.locator('button:has-text("未提出者を検知")').first();

  // ボタンが見つからない場合は、他の検知関連ボタンを試す
  if (!(await detectButton.isVisible())) {
    // 管理画面の "⚙ リマインダー設定管理" ボタンや検知ステータス表示エリアを確認
    const rmDetectStatus = page.locator('text=/未提出者自動検知ステータス/').first();
    if (await rmDetectStatus.isVisible()) {
      // 検知ステータスエリア内に検知実行ボタンがあるか探す
      const actionBtn = rmDetectStatus.locator('..').locator('button').first();
      if (await actionBtn.isVisible()) {
        await actionBtn.click();
      }
    }
  } else {
    await detectButton.click();
  }

  // 警告メッセージが表示されるまで最大10秒待機
  const warningMessage = page.locator('text=/日報データを取得できません。しばらく待ってから再度確認してください/');

  await expect(warningMessage).toBeVisible({ timeout: 10000 });

  // 未提出者一覧が表示されないことを確認
  const unsubmittedTable = page.locator('#rm-missing-tbody');
  const rows = await unsubmittedTable.locator('tr').count();
  expect(rows).toBe(0);
});
