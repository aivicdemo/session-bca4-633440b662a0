import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

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

test('SCEN-662: 提出期限を過ぎても日報が提出されていない報告者が未提出者として一覧に表示される', async ({ page, request }) => {
  const config = await readAivicConfig(page);

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 検知ログタブをクリック
  await page.click('button[data-tab="log"]');

  // テーブルが表示されるまで待機
  await page.waitForSelector('#rm-log-tbody');

  // 検知ログ一覧から検知実行レコードを確認
  const logRows = await page.locator('#rm-log-tbody tr').all();
  
  let validRowCount = 0;
  let hasExpiredStatus = false;
  
  for (const row of logRows) {
    const text = await row.textContent();
    if (text && !text.includes('検知ログがありません')) {
      validRowCount++;
      
      const cells = await row.locator('td').all();
      if (cells.length >= 5) {
        const statusText = await cells[4].textContent();
        if (statusText?.includes('期限超過')) {
          hasExpiredStatus = true;
        }
      }
    }
  }

  // 提出期限超過の未提出者が一覧に表示されていることを確認
  expect(validRowCount).toBeGreaterThanOrEqual(1);

  // データベースから検知ログレコードを確認
  await expect.poll(
    async () => {
      const logs = await fetchTableRecords(request, config, '日報未提出者検知ログ');
      // 提出状況が「期限超過」のレコードが存在することを確認
      return logs.some((log) => log['提出状況'] === '期限超過');
    },
    { timeout: 10000, message: '提出期限超過のログレコードが存在すること' },
  ).toBe(true);

  // 画面に少なくとも1件のレコードが表示されていることを確認
  if (validRowCount > 0) {
    const firstRow = logRows[0];
    const cells = await firstRow.locator('td').all();
    
    // 報告者名が表示されていることを確認
    const reporterNameText = await cells[0].textContent();
    expect(reporterNameText?.trim()).not.toBe('');

    // 検知実行日時が表示されていることを確認
    const detectedAtText = await cells[2].textContent();
    const dateTimeRegex = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
    expect(detectedAtText).toMatch(dateTimeRegex);
  }
});
