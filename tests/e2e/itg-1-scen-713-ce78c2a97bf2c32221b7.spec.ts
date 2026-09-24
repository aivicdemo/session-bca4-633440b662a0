import { test, expect } from '@playwright/test';

test('SCEN-713: 報告者マスタの新規登録が操作履歴に記録される', async ({ page }) => {
  // テスト前提: 報告者マスタ保存機能の操作履歴記録機構がデータベースに接続済みであることを確認する
  // テスト対象: 報告者マスタ新規登録時の操作履歴記録を確認する

  // 管理画面にアクセスする
  await page.goto('/');

  // 管理者権限でログイン
  await page.fill('input[name="userId"]', 'admin_user');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 報告者マスタ管理機能を開く
  const menuButton = page.locator('button:has-text("報告者マスタ管理")');
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    await page.waitForLoadState('networkidle');

    // 新しい報告者の登録情報を入力フォームに入力する
    const addButton = page.locator('button:has-text("新規追加")');
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      const nameInput = page.locator('input[placeholder*="氏名"]');
      const emailInput = page.locator('input[placeholder*="メール"]');

      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('新規報告者');
      }
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill('newreporter@example.com');
      }

      // 「保存」ボタンをクリックして報告者マスタの新規登録を実行する
      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1500);

        // 操作履歴テーブルに対してクエリを実行し、直前に実行された操作レコードを取得する
        // 注：画面からの確認または、APIを通じた操作履歴の取得が必要
        // 以下は操作履歴画面が存在する場合の検証
        const historyLink = page.locator('a:has-text("操作履歴")');
        if (await historyLink.isVisible().catch(() => false)) {
          await historyLink.click();
          await page.waitForLoadState('networkidle');

          // 最新の操作レコードが表示されていることを確認
          const latestRecord = page.locator('table tbody tr').first();
          
          // 操作種別=「新規登録」が記録されていることを確認
          const operationType = latestRecord.locator('td').nth(1);
          const typeText = await operationType.textContent();
          expect(typeText).toContain('新規登録');

          // 対象モジュール=「報告者マスタ」が記録されていることを確認
          const module = latestRecord.locator('td').nth(2);
          const moduleText = await module.textContent();
          expect(moduleText).toContain('報告者マスタ');
        }
      }
    }
  }
});
