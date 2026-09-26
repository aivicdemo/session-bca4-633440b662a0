import { test, expect } from '@playwright/test';

// SCEN-658: チームに報告者が1名も登録されていないとき、
// 警告メッセージ「チームに報告者が登録されていません」が表示される

test('SCEN-658: チームに報告者が未登録の場合、警告メッセージが表示される', async ({ page }) => {
  // テスト環境の日報確認・管理画面にアクセス
  await page.goto('./panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 日報確認・管理画面の未提出者検知機能を実行
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 警告メッセージが表示されることを確認
  const body = page.locator('body');
  const pageContent = await body.textContent();
  expect(pageContent).toContain('チームに報告者が登録されていません');
});
