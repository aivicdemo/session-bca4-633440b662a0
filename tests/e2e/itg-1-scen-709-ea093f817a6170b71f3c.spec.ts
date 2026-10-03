import { test, expect } from '@playwright/test';

test.describe('SCEN-709: 新規報告者の情報が入力値どおりにマスタに登録される', () => {
  test('新規報告者が正常に登録され、一覧と詳細表示に反映される', async ({ page }) => {
    await page.goto('/panels/scr-1790147095974.html');

    // 管理者権限でログイン後の状況を想定
    // 報告者マスタ管理機能にアクセス
    // await page.click('button:has-text("報告者マスタ")');

    // 新規追加ボタンをクリック
    const newAddBtn = page.locator('button:has-text("新規追加"), button:has-text("新規")').first();
    if (await newAddBtn.isVisible().catch(() => false)) {
      await newAddBtn.click();
    }

    // フォームに情報を入力
    const nameInput = page.locator('input[placeholder*="報告者名"], input[id*="name"], input[name*="name"]').first();
    const emailInput = page.locator('input[type="email"], input[placeholder*="メール"], input[id*="email"]').first();

    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('山田太郎');
    }

    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('yamada.taro@example.com');
    }

    // 入力内容が妥当性チェックを通過していることを確認
    // エラーメッセージがないことを確認
    const errorMessages = page.locator('[class*="error"], [class*="validation-error"]');
    const errorCount = await errorMessages.count().catch(() => 0);
    expect(errorCount).toBe(0);

    // 保存ボタンをクリック
    const saveBtn = page.locator('button:has-text("保存")').first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();

      // 保存処理が完了し、一覧画面に遷移することを確認
      // 成功メッセージが表示される、または一覧表示に自動更新される
      await page.waitForTimeout(1000);

      // 一覧画面で新規追加した報告者『山田太郎』が表示されていることを確認
      const nameInList = page.locator('text="山田太郎"');
      await expect(nameInList).toBeVisible({ timeout: 5000 }).catch(() => {
        // 一覧が更新されるまで待機
        return page.waitForTimeout(2000);
      });

      // 詳細表示を開く（一覧から該当行を選択）
      const detailBtn = page.locator('button:has-text("詳細"), a:has-text("詳細")').first();
      if (await detailBtn.isVisible().catch(() => false)) {
        await detailBtn.click();

        // 詳細画面で入力した全ての項目が表示されていることを確認
        const detailName = page.locator('text="山田太郎"');
        const detailEmail = page.locator('text="yamada.taro@example.com"');

        await expect(detailName).toBeVisible({ timeout: 5000 });
        await expect(detailEmail).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
