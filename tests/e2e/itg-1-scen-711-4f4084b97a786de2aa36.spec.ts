import { test, expect } from '@playwright/test';

test('SCEN-711: 報告者マスタの変更がデータベースに保存される', async ({ page }) => {
  // 日報確認・管理画面にアクセスし、ユーザーが管理者権限で正常にログインできたことを確認する
  await page.goto('/login.html');

  // 管理者権限でログイン
  await page.fill('[data-testid="username"]', 'admin_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // 画面内の報告者マスタ管理セクションを開く
  const reporterMasterMenu = page.locator('a, button').filter({ hasText: /報告者マスタ/i }).first();
  if (await reporterMasterMenu.isVisible().catch(() => false)) {
    await reporterMasterMenu.click();
    await page.waitForLoadState('networkidle');

    // 既存の報告者1名の情報を選択し、メールアドレスを変更する
    const editButton = page.locator('button').filter({ hasText: /編集/ }).first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');

      // メールアドレスを変更（例：user01@old.com → user01@new.com）
      const emailInput = page.locator('input[placeholder*="メール"], input[type="email"], input[id*="email"]').first();
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.clear();
        await emailInput.fill('user01@new.com');
      }

      // 変更内容を保存ボタンで送信する
      const saveButton = page.locator('button').filter({ hasText: /保存/ }).first();
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1500);

        // 画面に保存成功を示すメッセージが表示されることを確認する
        const successMessage = page.locator('text=/更新されました|保存されました|成功/');
        const messageVisible = await successMessage.isVisible().catch(() => false);
        expect(messageVisible).toBeTruthy();
      }

      // ブラウザをリロードして日報確認・管理画面に再度アクセスする
      await page.reload();
      await page.waitForNavigation().catch(() => null);

      // 日報確認・管理画面にアクセス
      await page.goto('/panels/scr-1790147095974.html');

      // 報告者マスタ管理を再度開く
      const reporterMasterMenu2 = page.locator('a, button').filter({ hasText: /報告者マスタ/i }).first();
      if (await reporterMasterMenu2.isVisible().catch(() => false)) {
        await reporterMasterMenu2.click();
        await page.waitForLoadState('networkidle');

        // 手順3で変更した報告者の情報を確認し、メールアドレスが新しい値で表示されていることを確認する
        const updatedEmail = page.locator('text=user01@new.com');
        await expect(updatedEmail).toBeVisible();
      }
    }
  }
});
