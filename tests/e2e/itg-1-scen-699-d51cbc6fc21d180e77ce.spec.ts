import { test, expect, type Page } from '@playwright/test';

// SCEN-699: 連続未提出が1日目の未提出者に対して推奨アクションが「メール催促」と判定される
//
// 仕様から：連続未提出が 1 日目のユーザーのレコード行において、推奨アクション列に「メール催促」と表示される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('連続未提出が1日目のユーザーのレコード行に推奨アクション「メール催促」が表示される', async ({ page }) => {
  // 1. 日報確認・管理画面を開く
  await login(page, 'leader_scen699');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 2. 定時自動検知により、連続未提出日数が 1 日目のユーザーを含む未提出者一覧が画面に表示されることを確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);

  // 3. 未提出者一覧から、連続未提出が 1 日目のユーザーレコードを特定する
  const targetRow = rows.first();
  const userName = (await targetRow.locator('td').nth(1).textContent())?.trim() ?? '';

  // 4. 該当ユーザーレコード行の推奨アクション列を確認する
  // 推奨アクション列に「メール催促」が表示されていることを確認
  // （仕様では推奨アクション列に「メール催促」と表示されることを期待）
  const recommendedActionColumn = targetRow.locator('td').nth(4);
  await expect(recommendedActionColumn).toContainText('メール催促');
});
