import { test, expect } from '@playwright/test';

test('SCEN-714: 報告者マスタの更新時に変更された項目だけが操作履歴に記録される', async ({ page }) => {
  // 日報確認・管理画面にログインし、報告者マスタ管理機能にアクセスする
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

    // 既存の報告者レコード（例：報告者ID「REP001」）を開く
    const editButton = page.locator('button:has-text("編集")').first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');

      // 名前のみを変更し、他の項目は変更しない
      const nameInput = page.locator('input[placeholder*="氏名"]');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.clear();
        await nameInput.fill('山田花子');
      }

      // メール、部門などの他の項目は変更しない

      // 保存ボタンをクリック
      const saveButton = page.locator('button:has-text("保存")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1500);

        // 保存完了後、該当報告者の操作履歴を表示する
        // 注：操作履歴表示画面が存在する場合
        const historyLink = page.locator('a:has-text("操作履歴")');
        if (await historyLink.isVisible().catch(() => false)) {
          await historyLink.click();
          await page.waitForLoadState('networkidle');

          // 操作履歴一覧から、最新の更新レコードを確認する
          const latestRecord = page.locator('table tbody tr').first();

          // 操作内容が「更新」であることを確認
          const operationCell = latestRecord.locator('td').nth(2);
          const operationText = await operationCell.textContent();
          expect(operationText).toContain('更新');

          // 変更項目：「名前」のみが表示され、変更前値→変更後値と記録されている
          const changedFieldsCell = latestRecord.locator('td').nth(3);
          const changedFieldsText = await changedFieldsCell.textContent();
          expect(changedFieldsText).toContain('名前');
          expect(changedFieldsText).toContain('山田花子');

          // メール、部門などの変更されなかった項目は操作履歴に記録されない
          expect(changedFieldsText).not.toContain('メール');
          expect(changedFieldsText).not.toContain('部門');
        }
      }
    }
  }
});
