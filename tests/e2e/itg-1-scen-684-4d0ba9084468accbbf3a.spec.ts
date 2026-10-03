import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-684: 選択された未提出者がシステムで有効な報告者として登録されていることが確認される

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

test('選択された未提出者がユーザーマスタで有効として登録されていることを確認', async ({ page, request }) => {
  await page.goto('/panels/scr-1790147095974.html');

  const config = await readAivicConfig(page);

  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();

  if (checkboxCount === 0) {
    test.skip();
  }

  await checkboxes.first().check();

  const firstRow = page.locator('#rm-missing-tbody tr').first();
  const nameCell = firstRow.locator('td').nth(1);
  const selectedName = await nameCell.textContent();

  if (!selectedName) {
    test.skip();
  }

  const userRecords = await fetchTableRecords(request, config, 'ユーザー');
  const matchedUser = userRecords.find(
    (u) => String(u['ユーザー名'] ?? '').includes(selectedName!) || String(u['氏名'] ?? '').includes(selectedName!),
  );

  expect(matchedUser).toBeTruthy();
  expect(String(matchedUser?.['ステータス'] ?? '')).toBe('有効');

  await checkboxes.first().uncheck();

  const stillVisibleRows = page.locator('#rm-missing-tbody tr', { hasText: selectedName });
  await expect(stillVisibleRows).toHaveCount(1);
});
