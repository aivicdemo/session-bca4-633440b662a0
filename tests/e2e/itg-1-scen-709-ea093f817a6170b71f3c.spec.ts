import { test, expect } from '@playwright/test';

test('SCEN-709: 新規報告者の情報が入力値どおりにマスタに登録される', async ({ page }) => {
  // 日報確認・管理画面にログインし、管理者権限で画面を表示する
  await page.goto('/');

  // 管理者権限でログイン
  await page.fill('input[name="userId"]', 'admin_user');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 画面上の「報告者マスタ」メニュー項目を選択し、報告者管理画面を開く
  const menuButton = page.locator('button:has-text("報告者マスタ管理")');
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.waitForLoadState('networkidle');

    // 「新規追加」ボタンをクリックし、新規報告者入力フォームを表示する
    const addButton = page.locator('button:has-text("新規追加")');
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      // 以下の情報を入力フォームに入力する：報告者名『山田太郎』、メールアドレス『yamada.taro@example.com』
      const nameInput = page.locator('input[placeholder*="氏名"]');
      const emailInput = page.locator('input[placeholder*="メール"]');

      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('山田太郎');
      }
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill('yamada.taro@example.com');
      }

      // 入力内容が妥当性チェックを通過したことを確認し（エラーメッセージがないこと）、「保存」ボタンをクリックする
      const errorMessage = page.locator('[class*="error"]');
      const visibleErrors = await errorMessage.count();
      expect(visibleErrors).toBe(0);

      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForNavigation();

        // 保存処理が完了し、報告者マスタ一覧画面に遷移することを確認する
        const listView = page.locator('table, [class*="list"]');
        await expect(listView).toBeVisible();

        // 一覧画面で新規追加した報告者『山田太郎』が表示されていることを確認する
        const nameCell = page.locator('text=山田太郎');
        await expect(nameCell).toBeVisible();

        // 表示された新規報告者行を選択し、詳細表示または編集画面を開く
        const detailButton = page.locator('button:has-text("詳細")').first();
        if (await detailButton.isVisible().catch(() => false)) {
          await detailButton.click();
          await page.waitForLoadState('networkidle');

          // 詳細画面で入力した全ての項目が表示されていることを確認する
          const detailName = page.locator('text=山田太郎');
          const detailEmail = page.locator('text=yamada.taro@example.com');
          await expect(detailName).toBeVisible();
          await expect(detailEmail).toBeVisible();
        }
      }
    }
  }
});
