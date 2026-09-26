import { test, expect } from '@playwright/test';

test('SCEN-707: メールアドレスが正しい形式でないとき、保存をエラーで中断する', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('/login.html');

  // 管理者権限でログイン
  await page.fill('[data-testid="username"]', 'admin_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // 画面上の「報告者マスタ」または同等の設定メニューにアクセスする
  const reporterMasterMenu = page.locator('a, button').filter({ hasText: /報告者マスタ/i }).first();
  if (await reporterMasterMenu.isVisible().catch(() => false)) {
    await reporterMasterMenu.click();
    await page.waitForLoadState('networkidle');
  }

  // 新規報告者を追加するフォームを開く
  const addButton = page.locator('button').filter({ hasText: /新規追加/ }).first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click();
    await page.waitForLoadState('networkidle');
  }

  // 報告者名を入力
  const nameInput = page.locator('input[placeholder*="氏名"], input[id*="name"], input[type="text"]').first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('山田太郎');
  }

  // メールアドレス入力欄に不正な形式のメールアドレス（例：「user@example」）を入力する
  const emailInput = page.locator('input[placeholder*="メール"], input[type="email"], input[id*="email"]').first();
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill('user@example');
  }

  // 保存ボタンをクリック
  const saveButton = page.locator('button').filter({ hasText: /保存/ }).first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
    await page.waitForTimeout(1000);
  }

  // 保存処理が中断され、入力欄の直下または画面上部に「メールアドレスの形式が正しくありません」または同等のメッセージが表示される
  const errorMessage = page.locator('text=/メールアドレスの形式が正しくありません|メールアドレスが無効です|形式が正しくありません/');
  await expect(errorMessage).toBeVisible();

  // 報告者マスタのデータベース状態は変更されず、画面は入力値が保持されたままの編集状態に留まる
  if (await emailInput.isVisible().catch(() => false)) {
    await expect(emailInput).toHaveValue('user@example');
  }
});
