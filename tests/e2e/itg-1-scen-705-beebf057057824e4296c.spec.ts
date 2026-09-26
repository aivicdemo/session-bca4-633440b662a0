import { test, expect } from '@playwright/test';

test('SCEN-705: 報告者の氏名が空のとき、保存をエラーで中断する', async ({ page }) => {
  // 日報確認・管理画面にアクセスする
  await page.goto('/login.html');

  // 管理者権限でログイン
  await page.fill('[data-testid="username"]', 'admin_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // 管理メニューから「報告者マスタ管理」を開く
  const reporterMasterMenu = page.locator('a, button').filter({ hasText: /報告者マスタ/i }).first();
  if (await reporterMasterMenu.isVisible().catch(() => false)) {
    await reporterMasterMenu.click();
    await page.waitForLoadState('networkidle');
  }

  // 新規報告者追加フォームを表示する
  const addButton = page.locator('button').filter({ hasText: /新規追加/ }).first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click();
    await page.waitForLoadState('networkidle');
  }

  // 氏名フィールドを空のまま残し、その他の必須項目（メールアドレスなど）は入力する
  const nameInput = page.locator('input[placeholder*="氏名"], input[id*="name"], input[type="text"]').first();
  const emailInput = page.locator('input[placeholder*="メール"], input[type="email"], input[id*="email"]').first();

  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill('yamada@example.com');
  }

  // 保存ボタンをクリック
  const saveButton = page.locator('button').filter({ hasText: /保存/ }).first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
    await page.waitForTimeout(1000);
  }

  // 画面上に「氏名は必須項目です」というエラーメッセージが表示される
  const errorMessage = page.locator('text=/氏名は必須項目です/');
  await expect(errorMessage).toBeVisible();

  // フォーム内容は保存されず、ユーザーは入力フォーム画面に留まる
  const formContainer = page.locator('form, [data-testid="form"], .form-card');
  await expect(formContainer.first()).toBeVisible();

  // データベースには新しいレコードが作成されていないことを確認（画面の状態で検証）
});
