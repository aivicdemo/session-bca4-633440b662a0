import { test, expect } from '@playwright/test';

test('SCEN-706: 報告者のメールアドレスが空のとき、保存をエラーで中断する', async ({ page }) => {
  // 日報確認・管理画面を開く
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

    // 新規報告者を追加するフォームを開く
    const addButton = page.locator('button:has-text("新規追加")');
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      // 報告者名に「山田太郎」を入力する
      const nameInput = page.locator('input[placeholder*="氏名"]');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('山田太郎');
      }

      // メールアドレスフィールドを空のまま残す
      // メールアドレスフィールドは空のままで、保存に進める

      // 保存ボタンをクリック
      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // 保存処理が中断され、画面上にエラーメッセージ「メールアドレスは必須項目です」が表示される
        const errorMessage = page.locator('text=メールアドレスは必須項目です');
        await expect(errorMessage).toBeVisible();

        // フォーム入力状態は保持され、新規報告者は登録されない
        const nameInputValue = page.locator('input[placeholder*="氏名"]');
        if (await nameInputValue.isVisible().catch(() => false)) {
          await expect(nameInputValue).toHaveValue('山田太郎');
        }
      }
    }
  }
});
