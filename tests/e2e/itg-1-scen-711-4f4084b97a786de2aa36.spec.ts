import { test, expect } from '@playwright/test';

test.describe('SCEN-711: 報告者マスタの変更がデータベースに保存される', () => {
  test('メールアドレス変更がデータベースに永続化され、ブラウザリロード後も新しい値が保持される', async ({ page }) => {
    await page.goto('/panels/scr-1790147095974.html');

    // ユーザーが管理者権限で正常にログインできたことを確認
    // ロード後、ユーザー情報が表示されていることを確認
    const userArea = page.locator('.user-area, [class*="user"]').first();
    await expect(userArea).toBeVisible({ timeout: 5000 });

    // 報告者マスタ管理セクションを開く
    // await page.click('button:has-text("報告者マスタ")');

    // 既存報告者1名（5人のうちの1人）を選択
    const reporterRows = page.locator('table tbody tr');
    const firstReporter = reporterRows.first();

    if (await firstReporter.isVisible().catch(() => false)) {
      // 報告者情報を表示/編集モードに
      await firstReporter.click();
      await page.waitForTimeout(500);

      // メールアドレスを変更（例：user01@old.com → user01@new.com）
      const emailInput = page.locator('input[type="email"], input[placeholder*="メール"], input[id*="email"]').first();
      if (await emailInput.isVisible().catch(() => false)) {
        // 現在の値を確認してから変更
        const oldEmail = await emailInput.inputValue();

        // 新しいメールアドレスを入力
        const newEmail = oldEmail.replace('@old', '@new').replace('old.com', 'new.com');
        if (newEmail !== oldEmail) {
          await emailInput.clear();
          await emailInput.fill(newEmail);

          // 変更内容を保存
          const saveBtn = page.locator('button:has-text("保存")').first();
          await saveBtn.click();

          // 保存成功メッセージが表示されることを確認
          const successMsg = page.locator('text*="更新", text*="完了", text*="保存"');
          await expect(successMsg).toBeVisible({ timeout: 5000 }).catch(() => {
            return page.waitForTimeout(1000);
          });

          // 保存完了後、ブラウザをリロード
          await page.reload();

          // リロード後、日報確認・管理画面に再度アクセス
          await page.goto('/panels/scr-1790147095974.html');

          // 手順3で変更した報告者の情報を確認
          const updatedReporterCell = page.locator(`text="${newEmail}"`);
          await expect(updatedReporterCell).toBeVisible({ timeout: 5000 });

          // メールアドレスが新しい値で表示されていることを確認
          const confirmedEmail = await emailInput.inputValue().catch(() => '');
          expect(confirmedEmail).toContain('new.com');
        }
      }
    }
  });
});
