import { test, expect } from '@playwright/test';

test('チームに報告者が1名も登録されていないとき、警告メッセージ「チームに報告者が登録されていません」が表示される', async ({ page }) => {
  // テスト環境の日報確認・管理画面にアクセスする
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // ユーザーマスタから現在のチームに割り当てられた報告者を確認し、全員を削除または未割り当て状態にする
  // （既にテスト環境で報告者なしに設定されている想定）

  // 日報確認・管理画面の未提出者検知機能を実行するトリガー（定時検知の手動実行ボタンなど）を操作する
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 画面が検知処理を完了するまで待機する
  await page.waitForLoadState('networkidle');

  // 日報確認・管理画面の警告メッセージ表示領域に「チームに報告者が登録されていません」というメッセージが表示される
  // メッセージは赤色または警告アイコン付きで視認可能な形式で表示される
  const body = page.locator('body');
  const pageContent = await body.textContent();
  expect(pageContent).toContain('チームに報告者が登録されていません');

  // 警告メッセージが確認できることを再度検証
  const warningMsg = page.locator('text=チームに報告者が登録されていません');
  await expect(warningMsg).toBeVisible();
});
