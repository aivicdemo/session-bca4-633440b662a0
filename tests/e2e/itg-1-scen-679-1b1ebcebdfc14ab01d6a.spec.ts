import { test, expect, type Page } from '@playwright/test';

// SCEN-679: リマインダー設定の必須項目が空の状態で保存しようとすると、保存が拒否されて入力エラーが表示される
//
// panels/scr-1790147095974.html には「リマインダー設定の新規作成フォーム」に対応する独立した画面はなく、
// 最も近い実装は #rm-settings-modal（既存の1件のリマインダー設定を編集するモーダル）である。また
// #rm-settings-save のクリックハンドラは `settings.time = root.querySelector('#rm-set-time').value ||
// settings.time;` という実装で、送信時刻欄（#rm-set-time）を空にしても既存値へ静かにフォールバックし、
// 入力エラーメッセージの表示や保存処理の中断は一切行われない（モーダルは常に閉じ、保存完了トーストが表示される）。
// この食い違いは .aivic/batches/18/unresolved.md に記録し、本テストは仕様の期待結果の文言どおりに検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リマインダー設定の必須項目が空の状態で保存しようとすると、保存が拒否されて入力エラーが表示される', async ({
  page,
}) => {
  // 手順1: 日報確認・管理画面へ遷移し、リマインダー設定管理セクションを開く
  await login(page, 'leader_scen679');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  const summaryBefore = await page.locator('#rm-settings-summary-text').textContent();

  // 手順2: リマインダー設定の新規作成フォームを表示する
  // （現行画面では既存設定を編集するリマインダー設定管理モーダルがこれに相当する）
  await page.locator('#rm-settings-btn').click();
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toHaveClass(/is-visible/);

  // 手順3: 必須項目（リマインダー送信時刻）を空のまま残す
  await page.locator('#rm-set-time').fill('');

  // 手順4: 保存ボタンをクリックする
  await page.locator('#rm-settings-save').click();

  // 期待結果: 空の必須項目の直下に赤色の入力エラーメッセージが表示される
  const errorMessage = page.getByText('リマインダー送信時刻を入力してください');
  await expect(errorMessage).toBeVisible();
  const color = await errorMessage.evaluate((el) => getComputedStyle(el).color);
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(rgbMatch).not.toBeNull();
  const [, r, , b] = (rgbMatch ?? ['', '0', '0', '0']).map(Number);
  expect(r).toBeGreaterThan(150);
  expect(b).toBeLessThan(100);

  // 期待結果: フォームはそのまま開いた状態で、リマインダー設定は保存されない
  await expect(settingsModal).toHaveClass(/is-visible/);
  const summaryAfter = await page.locator('#rm-settings-summary-text').textContent();
  expect(summaryAfter).toBe(summaryBefore);
});
