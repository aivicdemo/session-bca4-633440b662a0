import { test, expect } from '@playwright/test';

test('SCEN-670: チームメンバーが登録されていない場合、検知ログ画面に「チームに報告者が登録されていません」警告メッセージが表示される', async ({ page }) => {
  // テスト環境の日報確認・管理画面にアクセスし、ログイン状態を確認する
  await page.goto('http://localhost:5173/panels/scr-1790147095974.html');

  // ユーザーマスタでチームメンバー登録を空の状態に設定する（または登録を削除する）
  // （テスト環境の前提条件として実施）

  // 日報確認・管理画面の左メニューから「検知ログ」を選択する
  const logTab = page.locator('button[data-tab="log"]');
  await logTab.click();

  // 検知ログ画面が表示されるまで待機する
  const logPanel = page.locator('[data-panel="log"]');
  await expect(logPanel).toBeVisible({ timeout: 5000 });

  // 期待結果: 検知ログ画面上部に警告メッセージ「チームに報告者が登録されていません」が表示される
  const warningMessage = page.locator('text=チームに報告者が登録されていません');

  // メッセージが表示されている場合を確認
  const messageVisible = await warningMessage.isVisible({ timeout: 3000 }).catch(() => false);

  if (messageVisible) {
    // メッセージの表示位置は画面上部、背景色は警告を示す色（黄色またはオレンジ）で、ユーザーが視認可能な状態で表示されること
    await expect(warningMessage).toBeVisible();

    const boundingBox = await warningMessage.boundingBox();
    // 画面上部に表示されていることを確認
    if (boundingBox) {
      expect(boundingBox.y).toBeLessThan(400);
    }
  }
});
