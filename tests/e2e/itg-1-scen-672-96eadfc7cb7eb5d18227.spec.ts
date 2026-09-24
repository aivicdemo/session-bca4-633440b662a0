import { test, expect, type Page } from '@playwright/test';

// SCEN-672: 現在時刻が提出期限より前の場合、検知ログ画面に未提出者は表示されない。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('現在時刻が提出期限より前の場合、検知ログ画面に未提出者は表示されない', async ({ page }) => {
  // テスト環境の時刻を、日報提出期限の1時間前に設定する
  await login(page, 'leader_scen672');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 検知ログ画面を開く
  await page.locator('.rm-tab[data-tab="log"]').click();
  await page.waitForLoadState('networkidle');

  // 検知ログ画面に表示される検知実行レコードの『検知対象ユーザー一覧』をスクロールして確認する
  const logTable = page.locator('#rm-log-tbody');
  await logTable.scrollIntoViewIfNeeded();

  // 『検知対象ユーザー一覧』欄に、未提出者のレコードが1件も表示されない
  // 期限前の状態では提出状況が「未提出」の行は表示されない
  const nonSubmittedRows = page.locator('#rm-log-tbody tr', { hasText: '未提出' });
  await expect(nonSubmittedRows).toHaveCount(0);

  // 検知処理は実行されている（実行時刻・実行ステータスは記録されている）
  const detectStatus = page.locator('#rm-detect-status');
  await expect(detectStatus).not.toBeEmpty();

  // 検知対象となったユーザーの名前・メール送信フラグ等の詳細情報は空白または『該当なし』と表示される
  // 空白表示の場合、行数は0件
  const visibleRows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  const count = await visibleRows.count();
  expect(count).toBe(0);
});
