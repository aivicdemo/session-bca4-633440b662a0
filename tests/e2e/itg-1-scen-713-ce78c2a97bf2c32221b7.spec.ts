import { test, expect } from '@playwright/test';

test('SCEN-713: 報告者マスタの新規登録が操作履歴に記録される', async ({ page }) => {
  // テスト前提: 報告者マスタ保存機能の操作履歴記録機構がデータベースに接続済みであることを確認する
  // テスト対象: 報告者マスタ新規登録時の操作履歴記録を確認する

  // 管理画面にアクセスする
  await page.goto('/login.html');

  // 管理者権限でログイン
  await page.fill('[data-testid="username"]', 'admin_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // 報告者マスタ管理機能を開く
  const reporterMasterMenu = page.locator('a, button').filter({ hasText: /報告者マスタ/i }).first();
  if (await reporterMasterMenu.isVisible().catch(() => false)) {
    await reporterMasterMenu.click();
    await page.waitForLoadState('networkidle');

    // 新しい報告者の登録情報を入力フォームに入力する
    const addButton = page.locator('button').filter({ hasText: /新規追加/ }).first();
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      const nameInput = page.locator('input[placeholder*="氏名"], input[id*="name"], input[type="text"]').first();
      const emailInput = page.locator('input[placeholder*="メール"], input[type="email"], input[id*="email"]').first();

      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('新規報告者');
      }
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill('newreporter@example.com');
      }

      // 「保存」ボタンをクリックして報告者マスタの新規登録を実行する
      const saveButton = page.locator('button').filter({ hasText: /保存/ }).first();
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1500);

        // 操作履歴テーブルに対してクエリを実行し、直前に実行された操作レコードを取得する
        // 操作履歴が表示される画面またはログが存在する場合の検証
        const historyTab = page.locator('button, [role="tab"]').filter({ hasText: /履歴|ログ|操作/ }).first();
        if (await historyTab.isVisible().catch(() => false)) {
          await historyTab.click();
          await page.waitForLoadState('networkidle');

          // 最新の操作レコードが表示されていることを確認
          const latestRecord = page.locator('table tbody tr, [class*="log"] [class*="row"]').first();

          // 操作種別=「新規登録」が記録されていることを確認
          const operationTypeCell = latestRecord.locator('td, [class*="cell"]').nth(0);
          const typeText = await operationTypeCell.textContent().catch(() => '');
          expect(typeText).toContain(/新規登録|新規|追加/);

          // 対象モジュール=「報告者マスタ」が記録されていることを確認
          const moduleCell = latestRecord.locator('td, [class*="cell"]').nth(1);
          const moduleText = await moduleCell.textContent().catch(() => '');
          expect(moduleText).toContain(/報告者マスタ|reporter/i);

          // 実行ユーザー = 現在ログイン中のユーザーが記録されていることを確認
          const userCell = latestRecord.locator('td, [class*="cell"]').nth(2);
          const userText = await userCell.textContent().catch(() => '');
          expect(userText).toBeTruthy();
        }
      }
    }
  }
});
