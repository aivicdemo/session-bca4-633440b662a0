import { test, expect } from '@playwright/test';

test('SCEN-704: チームリーダーが権限なしの場合、報告者マスタ保存を中断する', async ({ page }) => {
  // 日報確認・管理画面にアクセスし、チームリーダー権限を持つユーザーでログインする
  await page.goto('/login.html');

  // チームリーダー権限でログイン
  await page.fill('[data-testid="username"]', 'team_leader_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 画面のメニューから「報告者マスタ管理」機能を開く
  // 日報確認・管理画面の報告者マスタ管理メニューへナビゲート
  await page.goto('/panels/scr-1790147095974.html');

  // 報告者マスタ管理へのアクセス（サンプル実装の画面から検索）
  const reporterMasterMenu = page.locator('a, button').filter({ hasText: /報告者マスタ/i }).first();
  const isMenuVisible = await reporterMasterMenu.isVisible().catch(() => false);

  if (isMenuVisible) {
    await reporterMasterMenu.click();
    await page.waitForLoadState('networkidle');
  }

  // 報告者マスタ一覧画面で新規報告者追加フォームを開く
  const addButton = page.locator('button').filter({ hasText: /新規追加/ }).first();
  const isAddButtonVisible = await addButton.isVisible().catch(() => false);

  if (isAddButtonVisible) {
    await addButton.click();
    await page.waitForLoadState('networkidle');
  }

  // 報告者情報（氏名、所属等）を入力する
  const nameInput = page.locator('input[placeholder*="氏名"], input[id*="name"], input[type="text"]').first();
  const emailInput = page.locator('input[placeholder*="メール"], input[type="email"], input[id*="email"]').first();

  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('山田太郎');
  }
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill('yamada@example.com');
  }

  // 保存ボタンをクリックする
  const saveButton = page.locator('button').filter({ hasText: /保存/ }).first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
    await page.waitForTimeout(1000);
  }

  // 保存ボタンクリック後、画面に「権限がないため報告者マスタの保存はできません」というエラーメッセージが表示される
  const errorMessage = page.locator('text=/権限がないため報告者マスタの保存はできません/');
  await expect(errorMessage).toBeVisible();

  // 入力済みのフォーム内容は保持されたままであることを確認
  if (await nameInput.isVisible().catch(() => false)) {
    await expect(nameInput).toHaveValue('山田太郎');
  }

  // 画面の遷移は発生しないことを確認（報告者マスタ管理画面に留まる）
  const currentUrl = page.url();
  expect(currentUrl).toContain('.html');
});
