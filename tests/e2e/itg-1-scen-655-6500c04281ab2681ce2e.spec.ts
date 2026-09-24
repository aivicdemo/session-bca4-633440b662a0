import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-655: リーダーのメールアドレスの形式が無効なとき、メール通知が送信されず
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

test('リーダーのメールアドレスの形式が無効な場合、通知送信失敗フラグが表示される', async ({
  page,
  request,
}) => {
  await page.goto('/panels/scr-1790147095974.html');
  const config = await readAivicConfig(page);

  // 定時自動検知による未提出者検知機能をトリガー実行またはテスト実行パラメータで検知処理を呼び出す
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible()) {
    await detectBtn.click();
  }

  // sendReminderEmail の呼び出しでリーダーのメールアドレス形式が無効なため送信に失敗するスタブレスポンスを返す

  // 管理画面をリロードまたは画面を再訪問
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 日報確認・管理画面の未提出者一覧テーブル内で当該リマインダー通知対象行を確認
  const unsubmittedTable = page.locator('#rm-missing-tbody');
  const rows = await unsubmittedTable.locator('tr');

  // 該当行に「通知送信失敗」フラグが表示されることを確認
  let foundFailureFlag = false;
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const rowText = await row.textContent();
    if (rowText?.includes('通知送信失敗')) {
      foundFailureFlag = true;
      // フラグは明確なテキストまたはアイコン（例：赤色の「通知送信失敗」ラベル、またはステータス列に「送信失敗」と表記）として視認可能
      const flagElement = row.locator('text=/通知送信失敗|送信失敗/');
      await expect(flagElement).toBeVisible();
      break;
    }
  }

  expect(foundFailureFlag).toBe(true);
});
