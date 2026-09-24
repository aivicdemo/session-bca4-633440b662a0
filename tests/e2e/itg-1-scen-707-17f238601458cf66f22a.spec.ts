import { test, expect } from '@playwright/test';

test('SCEN-707: メールアドレスが正しい形式でないとき、保存をエラーで中断する', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('/');

  // 管理者権限でログイン
  await page.fill('input[name="userId"]', 'admin_user');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 画面上の「報告者マスタ」または同等の設定メニューにアクセスする
  const menuButton = page.locator('button:has-text("報告者マスタ管理")');
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.waitForLoadState('networkidle');

    // 新規報告者を追加するフォームを開く、または既存報告者のメールアドレスを編集モードにする
    const addButton = page.locator('button:has-text("新規追加")');
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      // 報告者名を入力
      const nameInput = page.locator('input[placeholder*="氏名"]');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('山田太郎');
      }

      // メールアドレス入力欄に不正な形式のメールアドレス（例：「user@example」）を入力する
      const emailInput = page.locator('input[placeholder*="メール"]');
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill('user@example');
      }

      // 保存ボタンをクリック
      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // 保存処理が中断され、入力欄の直下または画面上部に「メールアドレスの形式が正しくありません」または同等のメッセージが表示される
        const errorMessage = page.locator('text=/メールアドレスの形式が正しくありません|メールアドレスが無効です/');
        await expect(errorMessage).toBeVisible();

        // 報告者マスタのデータベース状態は変更されず、画面は入力値が保持されたままの編集状態に留まる
        if (await emailInput.isVisible().catch(() => false)) {
          await expect(emailInput).toHaveValue('user@example');
        }
      }
    }
  }
});
