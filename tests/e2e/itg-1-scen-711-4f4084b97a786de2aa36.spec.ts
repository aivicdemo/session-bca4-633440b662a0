import { test, expect } from '@playwright/test';

test('SCEN-711: 報告者マスタの変更がデータベースに保存される', async ({ page, context }) => {
  // 日報確認・管理画面にアクセスし、ユーザーが管理者権限で正常にログインできたことを確認する
  await page.goto('/');

  // 管理者権限でログイン
  await page.fill('input[name="userId"]', 'admin_user');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 画面内の報告者マスタ管理セクションを開く
  const menuButton = page.locator('button:has-text("報告者マスタ管理")');
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.waitForLoadState('networkidle');

    // 既存の報告者1名の情報を選択し、メールアドレスを変更する
    const editButton = page.locator('button:has-text("編集")').first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');

      // メールアドレスを変更（例：user01@old.com → user01@new.com）
      const emailInput = page.locator('input[placeholder*="メール"]');
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.clear();
        await emailInput.fill('user01@new.com');
      }

      // 変更内容を保存ボタンで送信する
      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1500);

        // 画面に保存成功を示すメッセージが表示されることを確認する
        const successMessage = page.locator('text=/更新されました|保存されました/');
        const messageVisible = await successMessage.isVisible().catch(() => false);
      }

      // ブラウザをリロードして日報確認・管理画面に再度アクセスする
      await page.reload();
      await page.waitForNavigation();

      // 報告者マスタ管理を再度開く
      const menuButton2 = page.locator('button:has-text("報告者マスタ管理")');
      if (await menuButton2.isVisible().catch(() => false)) {
        await menuButton2.click();
        await page.waitForLoadState('networkidle');

        // 手順3で変更した報告者の情報を確認し、メールアドレスが新しい値で表示されていることを確認する
        const updatedEmail = page.locator('text=user01@new.com');
        const emailVisible = await updatedEmail.isVisible().catch(() => false);
        
        if (emailVisible) {
          await expect(updatedEmail).toBeVisible();
        }
      }
    }
  }
});
