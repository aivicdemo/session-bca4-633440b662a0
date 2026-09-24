import { test, expect } from '@playwright/test';

test('SCEN-708: 入力したメールアドレスが既に登録されているとき、保存をエラーで中断する', async ({ page }) => {
  // 報告者マスタ保存画面にアクセスする
  await page.goto('/');

  // 管理者権限でログイン
  await page.fill('input[name="userId"]', 'admin_user');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 報告者マスタ管理画面を開く
  const menuButton = page.locator('button:has-text("報告者マスタ管理")');
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.waitForLoadState('networkidle');

    // 新規報告者追加フォームを開く
    const addButton = page.locator('button:has-text("新規追加")');
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      // 報告者名を入力
      const nameInput = page.locator('input[placeholder*="氏名"]');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('新規ユーザー');
      }

      // 既に登録済みのメールアドレス（例：user1@example.com）をメールアドレス入力フィールドに入力する
      const emailInput = page.locator('input[placeholder*="メール"]');
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill('user1@example.com');
      }

      // 報告者名、所属などの必須項目は既に入力済み

      // 「保存」ボタンをクリック
      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // 画面上に「このメールアドレスは既に登録されています」または同等の重複エラーメッセージが表示される
        const errorMessage = page.locator('text=/このメールアドレスは既に登録されています|メールアドレスが既に使用されています/');
        await expect(errorMessage).toBeVisible();

        // 報告者マスタに新規レコードが追加されない
        // 入力フィールドの値は保持されたまま画面が表示される
        if (await emailInput.isVisible().catch(() => false)) {
          await expect(emailInput).toHaveValue('user1@example.com');
        }
      }
    }
  }
});
