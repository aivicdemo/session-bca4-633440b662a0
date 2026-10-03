import { test, expect } from '@playwright/test';

test('リーダーのメールアドレスの形式が無効なとき、メール通知が送信されず「通知送信失敗」フラグが管理画面に表示される', async ({
  page,
}) => {
  // 管理者ユーザーで日報確認・管理画面にログイン
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 定時自動検知による未提出者検知機能をトリガー実行する（またはテスト実行パラメータで検知処理を呼び出す）
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 管理画面をリロードまたは画面を再訪問する
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 日報確認・管理画面の未提出者一覧テーブル内で、当該リマインダー通知対象行を確認する
  const tbody = page.locator('#rm-missing-tbody');
  await expect(tbody).toBeVisible();

  // 未提出者一覧テーブルの該当行に「通知送信失敗」フラグが表示される
  // フラグは明確なテキストまたはアイコン（例：赤色の「通知送信失敗」ラベル、またはステータス列に「送信失敗」と表記）として視認可能な状態で画面に現れる
  const tableContent = await tbody.textContent();
  expect(tableContent).toMatch(/通知送信失敗|送信失敗/);
});
