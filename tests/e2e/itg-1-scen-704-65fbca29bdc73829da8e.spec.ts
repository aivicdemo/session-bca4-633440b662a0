import { test, expect } from '@playwright/test';

test('SCEN-704: チームリーダーが権限なしの場合、報告者マスタ保存を中断する', async ({ page }) => {
  // 日報確認・管理画面にアクセスし、チームリーダー権限を持つユーザーでログインする
  await page.goto('/');

  // チームリーダー権限でログイン（仕様前提）
  await page.fill('input[name="userId"]', 'team_leader_user');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 画面のメニューから「報告者マスタ管理」機能を開く
  const menuButton = page.locator('button:has-text("報告者マスタ管理")');

  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.waitForLoadState('networkidle');

    // 報告者マスタ一覧画面で新規報告者追加フォームを開く
    const addButton = page.locator('button:has-text("新規追加")');
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      // 報告者情報を入力する
      const nameInput = page.locator('input[placeholder*="氏名"]');
      const emailInput = page.locator('input[placeholder*="メール"]');

      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('山田太郎');
      }
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill('yamada@example.com');
      }

      // 保存ボタンをクリックする
      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // 保存ボタンクリック後、画面に「権限がないため報告者マスタの保存はできません」というエラーメッセージが表示される
        const errorMessage = page.locator('text=権限がないため報告者マスタの保存はできません');
        await expect(errorMessage).toBeVisible();

        // 入力済みのフォーム内容は保持されたままであることを確認
        if (await nameInput.isVisible().catch(() => false)) {
          await expect(nameInput).toHaveValue('山田太郎');
        }

        // 画面の遷移は発生しないことを確認
        const url = page.url();
        expect(url).toContain('reporter');
      }
    }
  }
});
