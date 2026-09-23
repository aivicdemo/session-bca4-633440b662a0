import { test, expect, type Page } from '@playwright/test';

// SCEN-677: チームリーダーがリマインダー設定管理画面にアクセスでき、現在の設定内容が表示される
//
// panels/scr-1790147095974.html の「未提出者・リマインダー」タブ（data-tab="reminder"）内にある
// 「⚙ リマインダー設定管理」ボタン（#rm-settings-btn）をクリックすると、リマインダー設定管理モーダル
// （#rm-settings-modal）が開き、有効フラグ（#rm-set-enabled）・送信時刻（#rm-set-time）・送信曜日
// （.rm-day-checkbox）・送信方法（#rm-set-method）の現在値が表示される。ただし、AIVIC_PAGE_INIT_JS 内の
// settings 変数（enabled/time/days/method のみ）には仕様の期待結果にある「送信対象ユーザー一覧」に対応する
// 項目が存在せず、リマインダー設定は現在ログイン中のリーダー自身の1件分のみを対象としている。この食い違いは
// .aivic/batches/18/unresolved.md に記録し、本テストは画面に実在する設定項目（送信時刻・送信曜日・送信方法・
// 有効フラグ）の表示・操作可能性を検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('チームリーダーがリマインダー設定管理画面にアクセスでき、現在の設定内容が表示される', async ({ page }) => {
  // 手順1: チームリーダーユーザーでシステムにログインする
  await login(page, 'leader_scen677');

  // 手順2: 日報確認・管理画面へ遷移する
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順3: 画面内の「リマインダー設定管理」セクション/ボタンにアクセスする
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  await expect(page.locator('#rm-settings-summary-text')).toBeVisible();
  await page.locator('#rm-settings-btn').click();

  // 手順4: リマインダー設定管理画面が表示されるまで待機する
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toHaveClass(/is-visible/);
  await expect(settingsModal.getByRole('heading', { name: 'リマインダー設定管理' })).toBeVisible();

  // 手順5: 画面に表示された現在のリマインダー設定内容を確認する
  // （送信時刻・送信対象者・送信間隔などに対応する、画面に実在する設定項目を確認する）
  await expect(page.locator('#rm-set-enabled')).toBeChecked();
  await expect(page.locator('#rm-set-time')).toHaveValue('18:00');
  for (const day of ['月', '火', '水', '木', '金']) {
    await expect(page.locator(`.rm-day-checkbox[data-day="${day}"]`)).toBeChecked();
  }
  for (const day of ['土', '日']) {
    await expect(page.locator(`.rm-day-checkbox[data-day="${day}"]`)).not.toBeChecked();
  }
  await expect(page.locator('#rm-set-method')).toHaveValue('メール');

  // 期待結果: 設定値の入力フィールド・確認表示が操作可能な状態となっている
  await expect(page.locator('#rm-set-enabled')).toBeEnabled();
  await expect(page.locator('#rm-set-time')).toBeEnabled();
  await expect(page.locator('#rm-set-method')).toBeEnabled();
  for (const day of ['月', '火', '水', '木', '金', '土', '日']) {
    await expect(page.locator(`.rm-day-checkbox[data-day="${day}"]`)).toBeEnabled();
  }
});
