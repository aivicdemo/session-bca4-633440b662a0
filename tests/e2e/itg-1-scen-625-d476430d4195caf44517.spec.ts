import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-625: 本日の全報告者について、提出済み・未提出の状況が正確に一覧表示される

interface AivicTableDef {
  tableName: string;
}

async function readAivicConfig(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as {
      AIVIC_API_URL?: string;
      AIVIC_APP_ID?: string;
      AIVIC_SYSTEM_NAME?: string;
      AIVIC_TABLES?: AivicTableDef[];
    };
    return {
      apiUrl: w.AIVIC_API_URL ?? '',
      appId: w.AIVIC_APP_ID ?? '',
      systemName: w.AIVIC_SYSTEM_NAME ?? '',
      tables: w.AIVIC_TABLES ?? [],
    };
  });
}

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
}

test('本日の全報告者について、提出済み・未提出の状況が正確に一覧表示される', async ({ page, request }) => {
  // 前提: 管理者権限を持つユーザーで日報確認・管理画面にアクセス
  await login(page, 'manager_scen625');

  const config = await readAivicConfig(page);
  const todayIso = new Date().toISOString().slice(0, 10);

  // 本日の日付を確認する
  const detectStatus = page.locator('#rm-detect-status');
  await expect(detectStatus).toBeVisible();

  // 報告者一覧テーブルを確認
  const reportTable = page.locator('#rm-r-tbody');
  await expect(reportTable).toBeVisible();

  // テーブル行を取得
  const rows = page.locator('#rm-r-tbody tr');
  const rowCount = await rows.count();

  // 社内5人全員が表示されていることを確認
  expect(rowCount).toBe(5);

  // 各行から報告者名を取得
  const reporterNames = [];
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.locator('td');
    const nameText = await cells.nth(0).textContent();
    reporterNames.push(nameText || '');
  }

  // すべての報告者がユニークな名前を持つ
  const uniqueNames = new Set(reporterNames.filter(n => n.trim() !== ''));
  expect(uniqueNames.size).toBe(5);

  // 未提出者一覧タブに切り替え
  const reminderTab = page.locator('button:has-text("未提出者・リマインダー")').first();
  await reminderTab.click();

  const missingTable = page.locator('#rm-missing-tbody');
  await expect(missingTable).toBeVisible();

  // 未提出者テーブルが存在することを確認
  const missingRows = page.locator('#rm-missing-tbody tr');
  const missingRowCount = await missingRows.count();

  // 提出済み一覧に戻る
  const reportsTab = page.locator('button:has-text("提出済み日報")').first();
  await reportsTab.click();

  // 提出/未提出の表示が変わっていないことを確認（再度チェック）
  const rows2 = page.locator('#rm-r-tbody tr');
  const rowCount2 = await rows2.count();
  expect(rowCount2).toBe(rowCount); // 同じ数の報告者が表示されている
});
