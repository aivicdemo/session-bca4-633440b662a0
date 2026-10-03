import { test, expect } from '@playwright/test';

test('SCEN-654: リーダーのメールアドレスが登録されていないとき、通知送信失敗フラグが表示される', async ({
  page,
}) => {
  // テスト環境で日報確認・管理画面にアクセスする
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者検知機能を手動実行する
  // リーダーのメールアドレスが登録されていない状態を想定し、
  // 検知処理でメール送信が失敗する
  const detectBtn = page.locator('#rm-send-reminder-btn');
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 画面を更新して未提出者一覧を表示する
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 未提出者一覧を表示する
  await page.waitForSelector('#rm-missing-tbody', { timeout: 10000 });

  // 該当するリーダー配下の報告者に対応する行を確認する
  const missingTbody = page.locator('#rm-missing-tbody');
  const tableContent = await missingTbody.textContent();

  // 「通知送信失敗」フラグが管理画面に表示されることを確認
  // 該当行に通知送信失敗が示されることを確認
  const failureIndicator = page.locator(
    '#rm-missing-tbody:has-text("通知送信失敗")',
  );

  await expect(failureIndicator).toBeVisible({ timeout: 10000 });
});
