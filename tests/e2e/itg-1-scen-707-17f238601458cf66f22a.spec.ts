import { test, expect } from '@playwright/test';

test.describe('SCEN-707: メールアドレスが正しい形式でないとき、保存をエラーで中断する', () => {
  test('不正な形式のメールアドレスで保存がエラーで中断される', async ({ page }) => {
    await page.goto('/panels/scr-1790147095974.html');

    // 新規追加フォームを開く
    // 実装待ち: 報告者マスタ管理セクションのナビゲーション

    // テストするメールアドレス（不正な形式）
    const invalidEmails = ['user@example', 'user@.com', 'user name@example.com'];

    for (const invalidEmail of invalidEmails) {
      // メールアドレス入力欄に不正な形式を入力
      const emailInputs = page.locator('input[type="email"], input[placeholder*="メール"], input[id*="email"]');
      if (await emailInputs.first().isVisible().catch(() => false)) {
        await emailInputs.first().fill(invalidEmail);

        // 保存ボタンをクリック
        const saveBtn = page.locator('button:has-text("保存")').first();
        await saveBtn.click();

        // エラーメッセージが表示されることを確認
        const errorMsg = page.locator('text="メールアドレスの形式が正しくありません", text*="形式"');
        await expect(errorMsg).toBeVisible({ timeout: 5000 });

        // 入力値が保持されていることを確認
        const emailValue = await emailInputs.first().inputValue();
        expect(emailValue).toBe(invalidEmail);
      }
    }
  });
});
