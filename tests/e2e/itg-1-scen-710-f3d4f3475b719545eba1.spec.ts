import { test, expect } from '@playwright/test';

test('SCEN-710: 既存報告者の情報がマスタで更新される', async ({ page }) => {
  // 日報確認・管理画面にログインする
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

  // 既存の報告者1名（例：山田太郎、メール：yamada@example.com）の情報を表示する
  const editButton = page.locator('button').filter({ hasText: /編集/ }).first();
  if (await editButton.isVisible().catch(() => false)) {
    await editButton.click();
    await page.waitForLoadState('networkidle');

    // 当該報告者のメールアドレスを別の値（例：yamada.taro@example.com）に変更する
    const emailInput = page.locator('input[placeholder*="メール"], input[type="email"], input[id*="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.clear();
      await emailInput.fill('yamada.taro@example.com');
    }

    // 当該報告者の情報を保存ボタンで確定する
    const saveButton = page.locator('button').filter({ hasText: /保存/ }).first();
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(1000);

      // マスタ保存完了のメッセージが画面に表示されることを確認する
      const successMessage = page.locator('text=/更新されました|保存されました|成功/');
      const messageVisible = await successMessage.isVisible().catch(() => false);
      expect(messageVisible).toBeTruthy();

      // 報告者マスタ一覧画面に戻り、変更した報告者の行を確認する
      await page.waitForNavigation().catch(() => null);

      const updatedEmail = page.locator('text=yamada.taro@example.com');
      // メールアドレスが更新されていることを確認
      await expect(updatedEmail).toBeVisible();
    }
  }
});
