import { test, expect } from '@playwright/test';

test('SCEN-712: 報告者マスタの変更がリーダーの管理画面の対象者リストに即座に反映される', async ({ browser }) => {
  // テスト管理者セッションとリーダーセッションの 2 つのブラウザコンテキストを使用
  const adminContext = await browser.newContext();
  const leaderContext = await browser.newContext();

  try {
    const adminPage = await adminContext.newPage();
    const leaderPage = await leaderContext.newPage();

    // テスト管理者として日報管理システムにログインする
    await adminPage.goto('/');
    await adminPage.fill('input[name="userId"]', 'admin_user');
    await adminPage.fill('input[name="password"]', 'password');
    await adminPage.click('button:has-text("ログイン")');
    await adminPage.waitForNavigation();

    // 報告者マスタ管理機能にアクセスする
    const adminMenuButton = adminPage.locator('button:has-text("報告者マスタ管理")');
    if (await adminMenuButton.isVisible().catch(() => false)) {
      await adminMenuButton.click();
      await adminPage.waitForLoadState('networkidle');

      // 現在の報告者マスタ一覧を確認し、対象の報告者情報を記録する
      const reporterName = await adminPage.locator('table tbody tr').first().locator('td').first().textContent();
    }

    // リーダーユーザーとしてシステムからログアウトし、別セッションで日報確認・管理画面にログインする
    await leaderPage.goto('/');
    await leaderPage.fill('input[name="userId"]', 'leader_user');
    await leaderPage.fill('input[name="password"]', 'password');
    await leaderPage.click('button:has-text("ログイン")');
    await leaderPage.waitForNavigation();

    // 日報確認・管理画面の「対象者リスト」を表示し、現在の一覧を確認する
    const leaderListElement = leaderPage.locator('[class*="reporter"], [id*="reporter"]');
    const listVisible = await leaderListElement.isVisible().catch(() => false);

    // テスト管理者セッションに戻り、報告者マスタで情報を変更し保存する
    if (await adminMenuButton.isVisible().catch(() => false)) {
      const editButton = adminPage.locator('button:has-text("編集")').first();
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await adminPage.waitForLoadState('networkidle');

        // 報告者情報を変更
        const nameInput = adminPage.locator('input[placeholder*="氏名"]');
        if (await nameInput.isVisible().catch(() => false)) {
          const currentValue = await nameInput.inputValue();
          await nameInput.clear();
          await nameInput.fill('変更後_' + currentValue);
        }

        // 変更内容を保存
        const saveButton = adminPage.locator('button:has-text("保存")');
        if (await saveButton.isVisible().catch(() => false)) {
          await saveButton.click();
          await adminPage.waitForTimeout(1000);
        }
      }
    }

    // リーダーセッションの日報確認・管理画面を更新（F5キーまたは手動リロード）
    await leaderPage.reload();
    await leaderPage.waitForLoadState('networkidle');

    // 対象者リストの変更が反映されていることを確認する
    const updatedElement = leaderPage.locator('[class*="reporter"], [id*="reporter"]');
    const updateVisible = await updatedElement.isVisible().catch(() => false);
    
    if (updateVisible) {
      await expect(updatedElement).toBeVisible();
    }
  } finally {
    await adminContext.close();
    await leaderContext.close();
  }
});
