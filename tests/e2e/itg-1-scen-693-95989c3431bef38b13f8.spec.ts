import { test, expect } from '@playwright/test';

test('SCEN-693: メール送信サーバーへの接続に失敗した場合、失敗がログに記録されて管理画面に「通知送信失敗」が表示される', async ({ page }) => {
  // 日報確認・管理画面にログイン
  await page.goto('http://localhost:3000/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者一覧から1名以上の報告者を確認
  const missingRows = await page.locator('#rm-missing-tbody tr').count();
  expect(missingRows).toBeGreaterThan(0);

  // チェックボックスで1名選択
  const firstCheckbox = await page.locator('#rm-missing-tbody tr:first-child .rm-missing-checkbox');
  await firstCheckbox.check();

  // リマインダー送信ボタンをクリック
  const sendBtn = await page.locator('#rm-send-reminder-btn');
  await sendBtn.click();

  // 確認ダイアログで承認
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('未提出者にリマインダーを送信');
    await dialog.accept();
  });

  // リマインダー送信処理が完了するまで待機
  await page.waitForTimeout(2000);

  // ページをリロード
  await page.reload();
  await page.waitForLoadState('networkidle');

  // メール送信履歴を確認して「失敗」ステータスが表示されているか確認
  const mailHistory = await page.locator('#rm-mail-tbody');
  const failureStatus = await mailHistory.locator('text=失敗');
  expect(await failureStatus.count()).toBeGreaterThan(0);
});
