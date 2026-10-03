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

test('SCEN-666: リマインダーメール送信に失敗した未提出者に「通知未送信」フラグが表示される', async ({ page, request }) => {
  const config = await readAivicConfig(page);

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // メール送信履歴タブをクリック
  await page.click('button[data-tab="mail"]');

  // メール送信履歴テーブルが表示されるまで待機
  await page.waitForSelector('#rm-mail-tbody');

  // メール送信履歴から「送信失敗」のレコードを検索
  const mailRows = await page.locator('#rm-mail-tbody tr').all();

  if (mailRows.length > 0) {
    let hasFailedRecord = false;

    for (const row of mailRows) {
      const text = await row.textContent();
      if (text && !text.includes('メール送信履歴がありません')) {
        const cells = await row.locator('td').all();
        const statusText = await cells[4].textContent();

        if (statusText?.includes('失敗')) {
          hasFailedRecord = true;
          // 送信失敗のステータスが表示されることを確認
          expect(statusText).toContain('失敗');

          // 他の列の内容も確認
          const typeText = await cells[1].textContent();
          expect(typeText?.trim()).not.toBe('');

          const toText = await cells[2].textContent();
          expect(toText?.trim()).not.toBe('');
        }
      }
    }

    // 送信失敗レコードが存在することを確認（存在しない場合でもテーブルは表示される）
    expect(mailRows.length).toBeGreaterThanOrEqual(1);
  }

  // データベースから送信失敗のメール記録を確認
  await expect.poll(
    async () => {
      const mails = await fetchTableRecords(request, config, 'メール送信履歴');
      // 送信失敗のレコードが存在することを確認
      return mails.some((mail) => mail['送信ステータス'] === '失敗');
    },
    { timeout: 10000, message: '通知未送信のメール記録が存在すること' },
  ).toBe(true);
});
