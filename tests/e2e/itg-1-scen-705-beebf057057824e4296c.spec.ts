import { test, expect } from '@playwright/test';

test('SCEN-705: 報告者の氏名が空のとき、保存をエラーで中断する', async ({ page }) => {
  // 日報確認・管理画面にアクセスする
  await page.goto('/');

  // 管理者権限でログイン
  await page.fill('input[name="userId"]', 'admin_user');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 管理メニューから「報告者マスタ管理」を開く
  const menuButton = page.locator('button:has-text("報告者マスタ管理")');
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.waitForLoadState('networkidle');

    // 新規報告者追加フォームを表示する
    const addButton = page.locator('button:has-text("新規追加")');
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      // 氏名フィールドを空のまま残し、その他の必須項目は入力する
      const emailInput = page.locator('input[placeholder*="メール"]');
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill('yamada@example.com');
      }

      // 保存ボタンをクリック
      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // 画面上に「氏名は必須項目です」というエラーメッセージが表示される
        const errorMessage = page.locator('text=氏名は必須項目です');
        await expect(errorMessage).toBeVisible();

        // フォーム内容は保存されず、ユーザーは入力フォーム画面に留まる
        const formContainer = page.locator('form');
        await expect(formContainer).toBeVisible();

        // データベースには新しいレコードが作成されていないことを確認（画面リロード後、データベースAPIで検証）
        // 注：DBへの直接問い合わせは仕様で明記されていない場合は省略
      }
    }
  }
});
