import { test, expect, type Page } from '@playwright/test';

// SCEN-668: 提出期限の時刻が設定されていない場合、検知ログ画面に「提出期限が設定されていません。システム管理者に連絡してください」エラーメッセージが表示される

test('提出期限が未設定の場合、エラーメッセージが表示される', async ({ page }) => {
  // 手順1-2: テスト環境で日報確認・管理画面にログイン（管理者権限を持つユーザー）
  await page.goto('/panels/scr-1790147095974.html');

  // 手順3-4: 検知ログ確認機能を開く（タブ切り替え）
  const logTab = page.locator('.rm-tab[data-tab="log"]');
  await logTab.click();

  // 検知ログパネルが表示されるまで待機
  const logPanel = page.locator('[data-panel="log"]');
  await expect(logPanel).toHaveClass(/is-active/);

  // 期待結果: エラーメッセージが画面に表示される
  // メッセージ「提出期限が設定されていません。システム管理者に連絡してください」が表示される
  const errorMessage = page.locator('text=提出期限が設定されていません。システム管理者に連絡してください');

  // エラーメッセージが存在することを確認
  // ※ 仕様により、提出期限時刻が NULL の場合、このメッセージがメインメッセージエリアに表示されるべき
  await expect(errorMessage).toBeVisible({ timeout: 3000 });

  // 検知ログの一覧はレンダリングされず、エラーメッセージのみが表示される状態
  const logTable = logPanel.locator('#rm-log-tbody');

  // テーブルが空または存在しないことを確認
  const logRows = logTable.locator('tr:not(.rm-empty-row)');
  await expect(logRows).toHaveCount(0);
});
