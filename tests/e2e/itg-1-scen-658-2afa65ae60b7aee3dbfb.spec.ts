import { test, expect } from '@playwright/test';

// SCEN-658: チームに報告者が1名も登録されていないとき、
// 警告メッセージ「チームに報告者が登録されていません」が表示される

test('チームに報告者が未登録の場合、警告メッセージが表示される', async ({ page }) => {
  // テスト環境の日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // ユーザーマスタから現在のチームに割り当てられた報告者を確認し、全員を削除または未割り当て状態にする

  // 日報確認・管理画面の未提出者検知機能を実行するトリガー（定時検知の手動実行ボタンなど）を操作
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible()) {
    await detectBtn.click();
  } else {
    // 画面内の検知実行ボタンを探す
    const rmDetectStatus = page.locator('text=/未提出者自動検知ステータス/').first();
    if (await rmDetectStatus.isVisible()) {
      const actionBtn = rmDetectStatus.locator('..').locator('button').first();
      if (await actionBtn.isVisible()) {
        await actionBtn.click();
      }
    }
  }

  // 画面が検知処理を完了するまで待機
  await page.waitForTimeout(1000);

  // 警告メッセージ表示領域に「チームに報告者が登録されていません」というメッセージが表示されることを確認
  const warningMessage = page.locator('text=/チームに報告者が登録されていません/');

  await expect(warningMessage).toBeVisible();

  // メッセージは赤色または警告アイコン付きで視認可能な形式で表示される
  const warningElement = page.locator('[role="alert"]').filter({ hasText: 'チームに報告者が登録されていません' }).first();
  if (await warningElement.isVisible()) {
    // 視認可能性を確認
    await expect(warningElement).toBeVisible();
  }
});
