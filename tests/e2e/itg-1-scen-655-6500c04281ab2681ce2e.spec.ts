import { test, expect } from '@playwright/test';

test('SCEN-655: リーダーのメールアドレスの形式が無効な場合、通知送信失敗フラグが表示される', async ({
  page,
}) => {
  await page.goto('./panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 定時自動検知による未提出者検知機能をトリガー実行
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 管理画面をリロードしてリマインダー送信結果を反映
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 未提出者一覧テーブル内で「通知送信失敗」フラグが表示されることを確認
  const tbody = page.locator('#rm-missing-tbody');
  const tableContent = await tbody.textContent();
  expect(tableContent).toMatch(/通知送信失敗|送信失敗/);
});
