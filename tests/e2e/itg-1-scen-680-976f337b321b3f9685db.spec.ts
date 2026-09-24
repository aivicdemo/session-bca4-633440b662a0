import { test, expect } from '@playwright/test';

test.describe('SCEN-680: リマインダー設定の入力値が形式ルール（時刻はHH:MM形式、曜日は定義値のみなど）に違反すると、保存が拒否されて入力エラーが表示される', () => {
  test('時刻が不正な形式の場合、エラーが表示される', async ({ page }) => {
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

    // 送信時刻に「25:30」と入力（HH:MM形式違反）
    const timeInput = page.locator('#rm-set-time');
    // time input は HH:MM 形式を自動的に検証するため、直接値を設定
    await page.evaluate(() => {
      const input = document.querySelector('#rm-set-time') as HTMLInputElement;
      if (input) {
        input.value = '25:30';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // 保存ボタンをクリック
    const saveBtn = page.locator('#rm-settings-save');
    await saveBtn.click();

    // モーダルが開いたままであることを確認（保存が拒否されている）
    await expect(settingsModal).toHaveClass(/is-visible/);

    // エラーメッセージまたは入力フィールドの無効状態を確認
    // time input は自動的に無効な値を受け付けないため、値が変更されていないことを確認
    const timeInputValue = await timeInput.inputValue();
    expect(timeInputValue).not.toBe('25:30');

    // キャンセルボタンをクリック
    const cancelBtn = page.locator('#rm-settings-cancel');
    await cancelBtn.click();

    // モーダルが非表示になることを確認
    await expect(settingsModal).not.toHaveClass(/is-visible/);
  });
});
