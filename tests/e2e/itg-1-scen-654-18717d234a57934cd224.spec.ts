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

test('リーダーのメールアドレスが未登録の場合、通知送信失敗フラグが表示される', async ({
  page,
  request,
}) => {
  await page.goto('/panels/scr-1790147095974.html');
  const config = await readAivicConfig(page);

  // 未提出者検知機能を手動実行または定時検知のトリガー条件を満たす状態にして自動実行を待つ
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible()) {
    await detectBtn.click();
  }

  // 画面を更新して未提出者一覧を表示
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 該当するリーダー配下の報告者に対応する行を確認
  const unsubmittedTable = page.locator('#rm-missing-tbody');
  const rows = await unsubmittedTable.locator('tr');

  // 未提出者一覧の該当行に「通知送信失敗」フラグが表示されることを確認
  let foundFailureFlag = false;
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const rowText = await row.textContent();
    if (rowText?.includes('通知送信失敗')) {
      foundFailureFlag = true;
      // フラグが視認可能であることを確認
      const flagElement = row.locator('text=/通知送信失敗/');
      await expect(flagElement).toBeVisible();
      break;
    }
  }

  expect(foundFailureFlag).toBe(true);
});
