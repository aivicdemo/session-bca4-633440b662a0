import { test, expect } from '@playwright/test';

test('SCEN-706: 報告者のメールアドレスが空のとき、保存をエラーで中断する', async ({ page }) => {
  // 日報確認・管理画面を開く
  await page.goto('/login.html');

  // 管理者権限でログイン
  await page.fill('[data-testid="username"]', 'admin_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 報告者マスタ管理機能にアクセスする
  // 注：仕様で「報告者マスタ管理」が参照されていますが、提供されたパネルには該当するURLが見つかりません
  await page.goto('/panels/reporter-master.html');

  // 新規報告者を追加するフォームを開く
  const addButton = page.locator('button').filter({ hasText: /新規追加/ });
  await addButton.click();

  // 報告者名に「山田太郎」を入力する
  await page.fill('input[name="name"]', '山田太郎');
  await page.fill('input[name="department"]', '営業部');

  // メールアドレスフィールドを空のまま残す（入力しない）

  // 保存ボタンをクリック
  const saveButton = page.locator('button').filter({ hasText: /保存/ });
  await saveButton.click();

  // 保存処理が中断され、画面上にエラーメッセージ「メールアドレスは必須項目です」が表示される
  const errorMessage = page.locator('text=/メールアドレスは必須項目です/');
  await expect(errorMessage).toBeVisible();

  // フォーム入力状態は保持され、新規報告者は登録されない
  await expect(page.locator('input[name="name"]')).toHaveValue('山田太郎');
});
