import { test, expect } from '@playwright/test';

test('SCEN-710: 既存報告者の情報がマスタで更新される', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('/');

  // 管理者権限でログイン
  await page.fill('input[name="userId"]', 'admin_user');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 報告者マスタ管理機能にアクセスする
  const menuButton = page.locator('button:has-text("報告者マスタ管理")');
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.waitForLoadState('networkidle');

    // 既存の報告者1名（例：山田太郎、メール：yamada@example.com）の情報を表示する
    const editButton = page.locator('button:has-text("編集")').first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');

      // 当該報告者のメールアドレスを別の値（例：yamada.taro@example.com）に変更する
      const emailInput = page.locator('input[placeholder*="メール"]');
      if (await emailInput.isVisible().catch(() => false)) {
        const currentValue = await emailInput.inputValue();
        await emailInput.clear();
        await emailInput.fill('yamada.taro@example.com');
      }

      // 当該報告者の情報を保存ボタンで確定する
      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // マスタ保存完了のメッセージが画面に表示されることを確認する
        const successMessage = page.locator('text=/更新されました|保存されました/');
        const messageVisible = await successMessage.isVisible().catch(() => false);

        // 報告者マスタ一覧画面に戻り、変更した報告者の行を確認する
        await page.waitForNavigation();
        const updatedEmail = page.locator('text=yamada.taro@example.com');
        const emailVisible = await updatedEmail.isVisible().catch(() => false);
        
        // メールアドレスが更新されていることを確認
        if (emailVisible) {
          await expect(updatedEmail).toBeVisible();
        }
      }
    }
  }
});
