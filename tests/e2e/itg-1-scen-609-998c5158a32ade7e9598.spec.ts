import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-609: 営業日かつ定時期限内（例：18:00まで）に提出した日報は、提出当日の日付で記録される
// （business-day-deadline-judgment#judgeBusinessDayAndDeadline が「営業日・期限内」と判定するケース）。
// 2026-09-21（月・営業日）17:00 に提出する。

const SUBMIT_DATETIME = '2026-09-21T17:00:00+09:00';
const SUBMIT_DATE = '2026-09-21';

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

async function fetchTableRecords(
  request: APIRequestContext,
  config: { apiUrl: string; appId: string; systemName: string; tables: AivicTableDef[] },
  tableName: string,
): Promise<any[]> {
  const tableIndex = config.tables.findIndex((t) => t.tableName === tableName);
  if (tableIndex < 0 || !config.apiUrl) return [];
  const query =
    `?app=${encodeURIComponent(config.appId)}` +
    `&system=${encodeURIComponent(config.systemName)}` +
    `&table=${encodeURIComponent(tableName)}`;
  const res = await request.get(`${config.apiUrl}/api/${tableIndex}${query}`);
  if (!res.ok()) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? []);
}

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('営業日かつ定時期限内の提出は当日の日付で記録される', async ({ page, request }) => {
  // テスト実行日が営業日（月～金）かつ定時期限内であることを確認する
  await page.clock.install({ time: new Date(SUBMIT_DATETIME) });
  await login(page, 'reporter_scen609');
  const config = await readAivicConfig(page);

  const content = '顧客A社への提案資料作成';
  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  // 日報入力欄に内容を入力する
  await textarea.fill(content);

  // 提出ボタンをクリック
  await submitBtn.click();

  // 妥当性チェックが完了し、提出処理が開始されることを確認する
  await expect(success).toBeVisible();

  // 日報確認・管理画面に遷移し、提出済み日報一覧を表示させる
  await page.locator('#rp-history-link').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 提出日報の日付カラムを確認する
  const searchField = page.locator('#rm-r-keyword');
  if (await searchField.isVisible()) {
    await searchField.fill(content);
  }
  const matchingRow = page.locator('#rm-r-tbody tr', { hasText: content });
  await expect(matchingRow).toContainText(SUBMIT_DATE);

  // 提出済み日報の日付が、提出操作を実行した当日の日付として記録・表示されていること
  const reportRecords = await fetchTableRecords(request, config, '日報');
  const matched = reportRecords.find((r) => r['業務内容'] === content);
  expect(String(matched?.['報告日'] ?? '')).toContain(SUBMIT_DATE);
});
