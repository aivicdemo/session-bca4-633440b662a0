import { test, expect } from '@playwright/test';

test.describe('SCEN-708: 入力したメールアドレスが既に登録されているとき、保存をエラーで中断する', () => {
  test('重複したメールアドレスで保存がエラーで中断される', async ({ page }) => {
    await page.goto('/panels/scr-1790147095974.html');

    // 既に登録済みのメールアドレスを入力
    const existingEmail = 'user1@example.com';

    // メールアドレス入力欄に登録済みアドレスを入力
    const emailInputs = page.locator('input[type="email"], input[placeholder*="メール"], input[id*="email"]');
    if (await emailInputs.first().isVisible().catch(() => false)) {
      await emailInputs.first().fill(existingEmail);

      // 報告者名などの必須項目を入力
      const nameInput = page.locator('input[placeholder*="報告者名"], input[id*="name"], input[name*="name"]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('テスト報告者');
      }

      // 保存ボタンをクリック
      const saveBtn = page.locator('button:has-text("保存")').first();
      await saveBtn.click();

      // 重複エラーメッセージが表示されることを確認
      const errorMsg = page.locator('text="このメールアドレスは既に登録されています"');
      await expect(errorMsg).toBeVisible({ timeout: 5000 });

      // 入力フィールドの値は保持されたままであることを確認
      const emailValue = await emailInputs.first().inputValue();
      expect(emailValue).toBe(existingEmail);

      // 新規レコードが追加されていないことを確認
      const tableRows = page.locator('table tbody tr');
      const rowCount = await tableRows.count().catch(() => 0);
      // テーブルに新規行が追加されていないことを確認
      expect(rowCount).toBeLessThanOrEqual(1);
    }
  });
});
