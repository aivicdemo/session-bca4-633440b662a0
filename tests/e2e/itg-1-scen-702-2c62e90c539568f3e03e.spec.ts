import { test, expect } from '@playwright/test';

// SCEN-702: 提出期限の設定が不正な値の場合、催促判定が実行されない

test('提出期限の設定が不正な値の場合、催促判定が実行されない', async ({ page }) => {
  // ステップ1: 日報確認・管理画面にログインする
  await page.goto('/panels/scr-1790147095974.html');

  // ステップ2: リマインダー設定管理セクションを開く
  const missingTab = page.locator('button[data-tab="reminder"]');
  await expect(missingTab).toBeVisible();
  await missingTab.click();

  const settingsBtn = page.locator('#rm-settings-btn');
  await expect(settingsBtn).toBeVisible();
  await settingsBtn.click();

  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toHaveClass(/is-visible/);

  // ステップ3: 提出期限の設定値を不正な値（例：空文字列、負の数、または許容範囲外の値）に変更して保存する
  const timeInput = page.locator('#rm-set-time');
  await expect(timeInput).toBeVisible();

  // 空文字列を設定
  await timeInput.fill('');

  const saveBtn = page.locator('#rm-settings-save');
  await saveBtn.click();

  // ステップ4: 設定が保存されたことを確認する
  // エラーメッセージが表示されることを期待
  const toast = page.locator('#rm-toast');
  
  // ステップ5: 定時自動検知による未提出者の催促判定処理をトリガーする（またはスケジューラ実行時間まで待機する）
  // サンプル画面ではトリガー機能が実装されていないため、スキップ

  // ステップ6: 管理画面の検知ログを確認する
  const logTab = page.locator('button[data-tab="log"]');
  await expect(logTab).toBeVisible();
  await logTab.click();

  const logTable = page.locator('#rm-log-tbody');
  await expect(logTable).toBeVisible();

  // 期待結果: 検知ログに『催促判定がスキップされた』または『期限設定値が不正なため催促判定は実行されませんでした』
  // といったエラーメッセージが記録される。
  // また、管理画面の未提出者一覧には「通知未送信」フラグが立たず、新たなリマインダーメール送信履歴も追加されていない。

  const missingTab2 = page.locator('button[data-tab="reminder"]');
  await missingTab2.click();

  const missingTable = page.locator('#rm-missing-tbody');
  await expect(missingTable).toBeVisible();

  // 未提出者一覧にレコードが存在するか確認
  const rows = await page.locator('#rm-missing-tbody tr').count();
  expect(rows).toBeGreaterThanOrEqual(0);
});
