import { test, expect } from '@playwright/test';

// SCEN-681: チームリーダー以外のユーザーがリマインダー設定管理画面にアクセスしようとすると、アクセスが拒否される

test('チームリーダー以外のユーザーがリマインダー設定管理画面にアクセスしようとすると、アクセスが拒否される', async ({ page }) => {
  // テスト用ブラウザセッションを開く
  // チームリーダー以外のユーザー（例：一般報告者ユーザー）でシステムにログインする
  await page.goto('/login.html');
  await page.fill('input[type="text"]', 'yamada.taro');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.waitForNavigation();

  // ログイン後、日報確認・管理画面へ遷移する
  await page.goto('/panels/scr-1790147095974.html');

  // 日報確認・管理画面内のリマインダー設定管理機能・ボタン・メニュー項目へアクセスを試行する
  const settingsBtn = page.locator('#rm-settings-btn');

  // 一般ユーザーがリマインダー設定管理ボタンをクリックできるか確認
  // または、ボタンが表示されないかを確認

  // ボタンが存在するか確認
  const btnExists = await settingsBtn.count() > 0;

  if (!btnExists || !(await settingsBtn.isVisible())) {
    // ボタンが表示されない場合 → アクセス制限されている
    await expect(settingsBtn).not.toBeVisible();
  } else {
    // ボタンが表示されている場合、クリックしてアクセスを試行
    await settingsBtn.click();

    // リマインダー設定管理画面が表示されないことを確認
    const settingsModal = page.locator('#rm-settings-modal');

    // モーダルが表示されないか、エラーメッセージが表示される
    try {
      await expect(settingsModal).not.toHaveClass(/is-visible/);
    } catch {
      // 画面上にエラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=/アクセス権限|制限されています|権限がありません/i');
      await expect(errorMessage).toBeVisible({ timeout: 2000 });
    }
  }

  // ユーザーは日報確認・管理画面の他の機能（提出済み日報の確認・閲覧など）へのアクセスは可能な状態のままである
  // タブや他の機能が表示されていることを確認
  const tabButtons = page.locator('.rm-tab');
  const tabCount = await tabButtons.count();
  expect(tabCount).toBeGreaterThan(0);
});
