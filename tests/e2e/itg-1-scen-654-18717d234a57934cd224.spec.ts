import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-654: リーダーのメールアドレスが登録されていないとき、メール通知が送信されず
// 「通知送信失敗」フラグが管理画面に表示される

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

test('SCEN-654: リーダーのメールアドレスが未登録の場合、通知送信失敗フラグが表示される', async ({
  page,
}) => {
  await page.goto('./panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者検知機能を手動実行
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 画面を更新して未提出者一覧を表示
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 未提出者一覧テーブルのテキスト内容を確認
  const unsubmittedTable = page.locator('#rm-missing-tbody');
  const tableContent = await unsubmittedTable.textContent();

  // 「通知送信失敗」フラグが表示されることを確認
  expect(tableContent).toContain('通知送信失敗');
});
