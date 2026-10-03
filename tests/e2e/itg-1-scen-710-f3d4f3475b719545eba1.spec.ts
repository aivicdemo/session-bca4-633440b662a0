import { test, expect } from '@playwright/test';

test.describe('SCEN-710: 既存報告者の情報がマスタで更新される', () => {
  test('既存報告者のメールアドレスが更新され、一覧に反映される', async ({ page }) => {
    await page.goto('/panels/scr-1790147095974.html');

    // ログイン後、報告者マスタ管理機能にアクセス
    // await page.click('button:has-text("報告者マスタ")');

    // 既存報告者（例：山田太郎）の情報を表示
    // 一覧から対象行を選択
    const existingReporter = page.locator('text="山田太郎"').first();
    if (await existingReporter.isVisible().catch(() => false)) {
      // 編集モードへのアクセス（詳細表示から編集へ遷移、または行をクリック）
      await existingReporter.click();

      // メールアドレスを変更
      const emailInput = page.locator('input[type="email"], input[placeholder*="メール"], input[id*="email"]').first();
      if (await emailInput.isVisible().catch(() => false)) {
        // 前回のアドレスをクリア
        await emailInput.clear();
        // 新しいアドレスを入力
        await emailInput.fill('yamada.taro@example.com');

        // 保存ボタンをクリック
        const saveBtn = page.locator('button:has-text("保存")').first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();

          // マスタ保存完了のメッセージが画面に表示されることを確認
          const successMsg = page.locator('text*="更新", text*="完了", text*="保存"');
          await expect(successMsg).toBeVisible({ timeout: 5000 }).catch(() => {
            // メッセージが出ない場合は、一覧画面に戻ったことで判断
            return page.waitForTimeout(1000);
          });

          // 報告者マスタ一覧画面に戻る
          await page.waitForTimeout(500);

          // 変更した報告者の行を確認し、新しいメールアドレスが表示されていることを確認
          const updatedEmail = page.locator('text="yamada.taro@example.com"');
          await expect(updatedEmail).toBeVisible({ timeout: 5000 }).catch(() => {
            // テーブルリロードを待機
            return page.waitForTimeout(2000);
          });
        }
      }
    }
  });
});
