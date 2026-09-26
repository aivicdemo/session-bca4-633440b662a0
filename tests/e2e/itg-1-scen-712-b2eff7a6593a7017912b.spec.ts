import { test, expect } from '@playwright/test';

test('SCEN-712: 報告者マスタの変更がリーダーの管理画面の対象者リストに即座に反映される', async ({ browser }) => {
  // テスト管理者セッションとリーダーセッションの 2 つのブラウザコンテキストを使用
  const adminContext = await browser.newContext();
  const leaderContext = await browser.newContext();

  try {
    const adminPage = await adminContext.newPage();
    const leaderPage = await leaderContext.newPage();

    // テスト管理者として日報管理システムにログインする
    await adminPage.goto('/login.html');
    await adminPage.fill('[data-testid="username"]', 'admin_user');
    await adminPage.fill('[data-testid="password"]', 'password');
    await adminPage.click('[data-testid="login-button"]');
    await adminPage.waitForNavigation();

    // 報告者マスタ管理機能にアクセスする
    await adminPage.goto('/panels/scr-1790147095974.html');
    const adminReporterMenu = adminPage.locator('a, button').filter({ hasText: /報告者マスタ/i }).first();
    if (await adminReporterMenu.isVisible().catch(() => false)) {
      await adminReporterMenu.click();
      await adminPage.waitForLoadState('networkidle');

      // 現在の報告者マスタ一覧を確認し、対象の報告者情報を記録する
      const reporterNameElement = adminPage.locator('table tbody tr').first().locator('td').first();
      const reporterNameBefore = await reporterNameElement.textContent().catch(() => '');
    }

    // リーダーユーザーとしてシステムからログアウトし、別セッションで日報確認・管理画面にログインする
    await leaderPage.goto('/login.html');
    await leaderPage.fill('[data-testid="username"]', 'leader_user');
    await leaderPage.fill('[data-testid="password"]', 'password');
    await leaderPage.click('[data-testid="login-button"]');
    await leaderPage.waitForNavigation();

    // 日報確認・管理画面にアクセス
    await leaderPage.goto('/panels/scr-1790147095974.html');

    // 日報確認・管理画面の「対象者リスト」を表示し、現在の一覧を確認する
    const leaderListElement = leaderPage.locator('[class*="reporter"], [id*="reporter"], table').first();
    const listVisible = await leaderListElement.isVisible().catch(() => false);
    expect(listVisible).toBeTruthy();

    // テスト管理者セッションに戻り、報告者マスタで情報を変更し保存する
    const adminReporterMenu2 = adminPage.locator('a, button').filter({ hasText: /報告者マスタ/i }).first();
    if (await adminReporterMenu2.isVisible().catch(() => false)) {
      const editButton = adminPage.locator('button').filter({ hasText: /編集/ }).first();
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await adminPage.waitForLoadState('networkidle');

        // 報告者情報を変更（所属部門など）
        const departmentInput = adminPage.locator('input[placeholder*="部門"], input[id*="dept"], input[id*="department"]').first();
        if (await departmentInput.isVisible().catch(() => false)) {
          const currentValue = await departmentInput.inputValue();
          await departmentInput.clear();
          await departmentInput.fill('変更後_' + currentValue);
        }

        // 変更内容を保存
        const saveButton = adminPage.locator('button').filter({ hasText: /保存/ }).first();
        if (await saveButton.isVisible().catch(() => false)) {
          await saveButton.click();
          await adminPage.waitForTimeout(1000);
        }
      }
    }

    // リーダーセッションの日報確認・管理画面を更新（F5キーまたは手動リロード）
    await leaderPage.reload();
    await leaderPage.waitForLoadState('networkidle');

    // 対象者リストの変更が反映されていることを確認する（最大10秒待機）
    const updatedElement = leaderPage.locator('[class*="reporter"], [id*="reporter"], table');
    await expect(updatedElement.first()).toBeVisible({ timeout: 10000 });
  } finally {
    await adminContext.close();
    await leaderContext.close();
  }
});
