import { test, expect } from '@playwright/test';

test.describe('SCEN-677: チームリーダーがリマインダー設定管理画面にアクセスでき、現在の設定内容が表示される', () => {
  test('チームリーダーがリマインダー設定管理画面へ正常にアクセスでき、リマインダー設定内容が表示される', async ({ page }) => {
    // ログイン画面へ遷移
    await page.goto('./login.html');

    // ログインフォームにチームリーダーの認証情報を入力
    await page.fill('input[data-testid="username"]', 'tanaka.hanako');
    await page.fill('input[data-testid="password"]', 'password');
    await page.click('button[data-testid="login-button"]');

    // インデックスページ経由で日報確認・管理画面へ遷移
    await page.waitForURL(/index\.html|scr-/);
    await page.goto('./panels/scr-1790147095974.html');
    await page.waitForLoadState('networkidle');

    // リマインダー設定管理ボタンが存在することを確認
    const settingsBtn = page.locator('#rm-settings-btn');
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toHaveText(/⚙ リマインダー設定管理/);

    // リマインダー設定管理ボタンをクリック
    await settingsBtn.click();

    // リマインダー設定管理モーダルが表示されることを確認
    const settingsModal = page.locator('#rm-settings-modal');
    await expect(settingsModal).toHaveClass(/is-visible/);

    // モーダルのタイトルを確認
    const modalTitle = page.locator('#rm-settings-modal h2');
    await expect(modalTitle).toHaveText('リマインダー設定管理');

    // 設定値フィールドが存在することを確認
    const enabledCheckbox = page.locator('#rm-set-enabled');
    const timeInput = page.locator('#rm-set-time');
    const methodSelect = page.locator('#rm-set-method');
    const dayCheckboxes = page.locator('.rm-day-checkbox');

    await expect(enabledCheckbox).toBeVisible();
    await expect(timeInput).toBeVisible();
    await expect(methodSelect).toBeVisible();
    const dayCount = await dayCheckboxes.count();
    expect(dayCount).toBeGreaterThan(0);

    // 送信時刻フィールドに値が設定されていることを確認
    const timeValue = await timeInput.inputValue();
    expect(timeValue).toMatch(/^\d{2}:\d{2}$/);

    // 送信方法がメール またはアプリ通知の値を持つことを確認
    const methodValue = await methodSelect.inputValue();
    expect(['メール', 'アプリ通知']).toContain(methodValue);

    // キャンセルボタンをクリックしてモーダルを閉じる
    const cancelBtn = page.locator('#rm-settings-cancel');
    await cancelBtn.click();

    // モーダルが非表示になることを確認
    await expect(settingsModal).not.toHaveClass(/is-visible/);

    // リマインダー設定が画面に表示されていることを確認
    const settingsSummary = page.locator('#rm-settings-summary-text');
    await expect(settingsSummary).toBeVisible();
    const summaryText = await settingsSummary.textContent();
    expect(summaryText).toBeTruthy();
  });
});
