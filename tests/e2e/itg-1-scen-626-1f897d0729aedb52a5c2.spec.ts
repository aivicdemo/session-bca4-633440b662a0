import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-626: 提出済み日報には報告内容と送信時刻が表示される

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

test('提出済み日報に報告内容と送信時刻が表示される', async ({ page, request }) => {
  const config = await readAivicConfig(page);

  // テスト用DB上に提出済み日報レコードが存在する前提で、画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // 画面上の「提出済み日報一覧」セクションを確認
  const reportsTab = page.locator('button[data-tab="reports"]');
  await expect(reportsTab).toBeVisible();

  // テーブルが読み込まれるまで待機
  await page.waitForSelector('#rm-r-tbody');

  // 一覧内でユーザーAの日報行を特定
  const tbody = page.locator('#rm-r-tbody');
  const rows = tbody.locator('tr');
  const rowCount = await rows.count();

  let foundReport = false;
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const nameCell = row.locator('td').nth(0);
    const nameText = await nameCell.textContent();

    // 実装データから確認できる報告者名で検索
    if (nameText?.includes('佐藤')) {
      // 報告内容カラムを確認
      const contentCell = row.locator('td').nth(2);
      const contentText = await contentCell.textContent();
      expect(contentText?.trim().length).toBeGreaterThan(0);

      // 送信時刻カラムを確認
      const submittedAtCell = row.locator('td').nth(3);
      const submittedAtText = await submittedAtCell.textContent();
      expect(submittedAtText?.trim().length).toBeGreaterThan(0);

      foundReport = true;
      break;
    }
  }

  // 少なくともいずれかの提出済み日報が表示されていることを確認
  expect(rowCount).toBeGreaterThan(0);

  // 各行について報告内容と送信時刻が表示されていることを確認
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.locator('td');

    // 報告内容が表示されている
    const contentCell = cells.nth(2);
    const contentText = await contentCell.textContent();
    expect(contentText?.trim().length).toBeGreaterThan(0);

    // 送信時刻が表示されている
    const submittedAtCell = cells.nth(3);
    const submittedAtText = await submittedAtCell.textContent();
    expect(submittedAtText?.trim().length).toBeGreaterThan(0);
  }
});
