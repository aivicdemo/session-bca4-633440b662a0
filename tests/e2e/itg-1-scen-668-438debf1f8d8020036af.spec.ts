import { test, expect } from '@playwright/test';

test('SCEN-668: 提出期限の時刻が設定されていない場合、検知ログ画面に「提出期限が設定されていません。システム管理者に連絡してください」エラーメッセージが表示される', async ({ page }) => {
  // テスト用DB環境にて、日報システムのリマインダー設定テーブルの『提出期限時刻』カラムをNULL（時刻未設定状態）に設定する
  // （テスト環境の前提条件として実施）

  // 日報確認・管理画面にログインし、管理者権限を持つユーザーで操作する
  await page.goto('http://localhost:5173/panels/scr-1790147095974.html');

  // 検知ログ確認機能を開く（日報確認・管理画面内の検知ログ・メール送信履歴確認セクション）
  const logTab = page.locator('button[data-tab="log"]');
  await logTab.click();

  // 検知ログ画面の初期表示時、または検知ログデータ一覧をリロード・再読込を実行する
  await page.reload();

  // 期待結果: 検知ログ画面のメインメッセージエリアに『提出期限が設定されていません。システム管理者に連絡してください』というエラーメッセージが画面上に表示される
  const errorMessage = page.locator('text=提出期限が設定されていません。システム管理者に連絡してください');
  await expect(errorMessage).toBeVisible({ timeout: 5000 });

  // 検針ログの一覧はレンダリングされず、エラーメッセージのみが表示される状態となることを確認
  const logTable = page.locator('#rm-log-tbody');
  const emptyState = logTable.locator('[class*="empty"]');
  await expect(emptyState).toBeVisible({ timeout: 5000 });
});
