import { test, expect } from '@playwright/test';

test.describe('SCEN-678: リマインダー設定の送信時刻・送信曜日・送信方法を変更し、保存すると設定が反映される', () => {
  test('リマインダー設定を変更して保存し、ページ再読み込み後に設定が反映される', async ({ page }) => {
    // ログイン画面へ遷移
    await page.goto('./login.html');

    // ログインフォームにチームリーダーの認証情報を入力
    await page.fill('input[data-testid="username"]', 'tanaka.hanako');
    await page.fill('input[data-testid="password"]', 'password');
    await page.click('button[data-testid="login-button"]');

    // 日報確認・管理画面へ遷移
    await page.waitForURL(/index\.html|scr-/);
    await page.goto('./panels/scr-1790147095974.html');
    await page.waitForLoadState('networkidle');

    // リマインダー設定管理ボタンをクリック
    const settingsBtn = page.locator('#rm-settings-btn');
    await settingsBtn.click();

    // リマインダー設定管理モーダルが表示されることを確認
    const settingsModal = page.locator('#rm-settings-modal');
    await expect(settingsModal).toHaveClass(/is-visible/);

    // 現在の設定値を取得
    const timeInput = page.locator('#rm-set-time');
    const originalTimeValue = await timeInput.inputValue();

    // 送信時刻を変更（例：9:00 → 10:30）
    await timeInput.fill('10:30');

    // 送信曜日を変更（月・水・金を選択）
    const mondayCheckbox = page.locator('[data-day="月"]');
    const wednesdayCheckbox = page.locator('[data-day="水"]');
    const fridayCheckbox = page.locator('[data-day="金"]');
    const allDayCheckboxes = page.locator('.rm-day-checkbox');

    // すべてのチェックボックスをクリアしてから、月・水・金のみを選択
    const dayCount = await allDayCheckboxes.count();
    for (let i = 0; i < dayCount; i++) {
      const checkbox = allDayCheckboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.click();
      }
    }
    await mondayCheckbox.click();
    await wednesdayCheckbox.click();
    await fridayCheckbox.click();

    // 送信方法を変更
    const methodSelect = page.locator('#rm-set-method');
    const currentMethod = await methodSelect.inputValue();
    const newMethod = currentMethod === 'メール' ? 'アプリ通知' : 'メール';
    await methodSelect.selectOption(newMethod);

    // 保存ボタンをクリック
    const saveBtn = page.locator('#rm-settings-save');
    await saveBtn.click();

    // トーストメッセージが表示されることを確認
    const toast = page.locator('#rm-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/is-visible/);
    await expect(toast).toContainText(/保存しました/);

    // モーダルが閉じることを確認
    await expect(settingsModal).not.toHaveClass(/is-visible/);

    // ページを再読み込み
    await page.reload();
    await page.waitForLoadState('networkidle');

    // リマインダー設定管理ボタンをもう一度クリック
    const settingsBtnAfterReload = page.locator('#rm-settings-btn');
    await settingsBtnAfterReload.click();

    const settingsModalAfterReload = page.locator('#rm-settings-modal');
    await expect(settingsModalAfterReload).toHaveClass(/is-visible/);

    // 変更した設定値が反映されていることを確認
    const timeInputAfterReload = page.locator('#rm-set-time');
    const methodSelectAfterReload = page.locator('#rm-set-method');

    const reloadedTimeValue = await timeInputAfterReload.inputValue();
    expect(reloadedTimeValue).toBe('10:30');

    const reloadedMethodValue = await methodSelectAfterReload.inputValue();
    expect(reloadedMethodValue).toBe(newMethod);

    // 選択された曜日を確認
    const mondayCheckboxAfterReload = page.locator('[data-day="月"]');
    const wednesdayCheckboxAfterReload = page.locator('[data-day="水"]');
    const fridayCheckboxAfterReload = page.locator('[data-day="金"]');

    expect(await mondayCheckboxAfterReload.isChecked()).toBe(true);
    expect(await wednesdayCheckboxAfterReload.isChecked()).toBe(true);
    expect(await fridayCheckboxAfterReload.isChecked()).toBe(true);

    // キャンセルボタンをクリック
    const cancelBtn = page.locator('#rm-settings-cancel');
    await cancelBtn.click();

    // モーダルが非表示になることを確認
    await expect(settingsModalAfterReload).not.toHaveClass(/is-visible/);

    // 設定概要が変更内容を反映していることを確認
    const settingsSummary = page.locator('#rm-settings-summary-text');
    const summaryText = await settingsSummary.textContent();
    expect(summaryText).toContain('10:30');
  });
});
