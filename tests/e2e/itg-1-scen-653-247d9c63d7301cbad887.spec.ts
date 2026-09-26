import { test, expect } from '@playwright/test';

test('SCEN-653: 日報データベース取得エラー時に警告メッセージが表示される', async ({ page }) => {
  // テスト環境で日報確認・管理画面にアクセス
  await page.goto('./panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 日報データベースが一時的に取得できない状態をシミュレート
  await page.route('**/api/**', (route) => {
    route.abort('failed');
  });

  // 未提出者検知ボタンをクリックして検知処理を実行
  const detectButton = page.locator('button:has-text("未提出者を検知")').first();

  if (!(await detectButton.isVisible({ timeout: 1000 }).catch(() => false))) {
    // 検知をトリガーするため画面を再読み込み
    await page.reload();
  } else {
    await detectButton.click();
  }

  // 警告メッセージが表示されるまで最大10秒待機
  const warningMessage = page.locator(
    'text=日報データを取得できません。しばらく待ってから再度確認してください',
  );

  await expect(warningMessage).toBeVisible({ timeout: 10000 });

  // 未提出者一覧が表示されないことを確認
  const emptyRow = page.locator('#rm-missing-tbody .rm-empty-row');
  const rowText = await emptyRow.textContent();
  expect(rowText).toContain('未提出者はいません');
});
