import { test, expect } from '@playwright/test';

test('SCEN-706: 報告者のメールアドレスが空のとき、保存をエラーで中断する', async ({ page }) => {
  // 日報確認・管理画面を開く
  await page.goto('/login.html');

  // 管理者権限でログイン
  await page.fill('[data-testid="username"]', 'admin_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // 報告者マスタ管理機能にアクセスする
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

  // 報告者名に「山田太郎」を入力する
  const nameInput = page.locator('input[placeholder*="氏名"], input[id*="name"], input[type="text"]').first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('山田太郎');
  }

  // メールアドレスフィールドを空のまま残す（入力しない）

  // 保存ボタンをクリック
  const saveButton = page.locator('button').filter({ hasText: /保存/ }).first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
    await page.waitForTimeout(1000);
  }

  // 保存処理が中断され、画面上にエラーメッセージ「メールアドレスは必須項目です」が表示される
  const errorMessage = page.locator('text=/メールアドレスは必須項目です/');
  await expect(errorMessage).toBeVisible();

  // フォーム入力状態は保持され、新規報告者は登録されない
  if (await nameInput.isVisible().catch(() => false)) {
    await expect(nameInput).toHaveValue('山田太郎');
  }
});
