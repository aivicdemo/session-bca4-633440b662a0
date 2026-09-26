import { test, expect } from '@playwright/test';

test('SCEN-709: 新規報告者の情報が入力値どおりにマスタに登録される', async ({ page }) => {
  // 日報確認・管理画面にログインし、管理者権限で画面を表示する
  await page.goto('/login.html');

  // 管理者権限でログイン
  await page.fill('[data-testid="username"]', 'admin_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // 画面上の「報告者マスタ」メニュー項目を選択し、報告者管理画面を開く
  const reporterMasterMenu = page.locator('a, button').filter({ hasText: /報告者マスタ/i }).first();
  if (await reporterMasterMenu.isVisible().catch(() => false)) {
    await reporterMasterMenu.click();
    await page.waitForLoadState('networkidle');
  }

  // 「新規追加」ボタンをクリックし、新規報告者入力フォームを表示する
  const addButton = page.locator('button').filter({ hasText: /新規追加/ }).first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click();
    await page.waitForLoadState('networkidle');
  }

  // 以下の情報を入力フォームに入力する：報告者名『山田太郎』、メールアドレス『yamada.taro@example.com』
  const nameInput = page.locator('input[placeholder*="氏名"], input[id*="name"], input[type="text"]').first();
  const emailInput = page.locator('input[placeholder*="メール"], input[type="email"], input[id*="email"]').first();

  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('山田太郎');
  }
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill('yamada.taro@example.com');
  }

  // 入力内容が妥当性チェックを通過したことを確認し（エラーメッセージがないこと）、「保存」ボタンをクリックする
  const errorElements = page.locator('[class*="error"], [role="alert"]');
  const visibleErrorCount = await errorElements.count();
  expect(visibleErrorCount).toBe(0);

  const saveButton = page.locator('button').filter({ hasText: /保存/ }).first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
    await page.waitForNavigation();
  }

  // 保存処理が完了し、報告者マスタ一覧画面に遷移することを確認する
  const listView = page.locator('table, [class*="list"], [class*="table"]');
  await expect(listView.first()).toBeVisible();

  // 一覧画面で新規追加した報告者『山田太郎』が表示されていることを確認する
  const nameCell = page.locator('text=山田太郎');
  await expect(nameCell).toBeVisible();

  // 表示された新規報告者行を選択し、詳細表示または編集画面を開く
  const detailButton = page.locator('button').filter({ hasText: /詳細/ }).first();
  if (await detailButton.isVisible().catch(() => false)) {
    await detailButton.click();
    await page.waitForLoadState('networkidle');

    // 詳細画面で入力した全ての項目が表示されていることを確認する
    const detailName = page.locator('text=山田太郎');
    const detailEmail = page.locator('text=yamada.taro@example.com');
    await expect(detailName).toBeVisible();
    await expect(detailEmail).toBeVisible();
  }
});
