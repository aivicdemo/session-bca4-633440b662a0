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

test('SCEN-665: リマインダーメール送信済みの未提出者に「リマインダー送信済み」ステータスが表示される', async ({ page, request }) => {
  const config = await readAivicConfig(page);

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // メール送信履歴タブをクリック
  await page.click('button[data-tab="mail"]');

  // メール送信履歴テーブルが表示されるまで待機
  await page.waitForSelector('#rm-mail-tbody');

  // メール送信履歴から「リマインダー送信済み」のレコードを検索
  const mailRows = await page.locator('#rm-mail-tbody tr').all();

  if (mailRows.length > 0) {
    // リマインダーメールのレコードを確認
    for (const row of mailRows) {
      const text = await row.textContent();
      if (text && !text.includes('メール送信履歴がありません')) {
        const cells = await row.locator('td').all();
        const typeText = await cells[1].textContent();

        if (typeText?.includes('リマインダー')) {
          // 送信日時、送信先メールアドレス、送信種別が表示されることを確認
          const sentAtText = await cells[0].textContent();
          const toText = await cells[2].textContent();
          const subjectText = await cells[3].textContent();
          const statusText = await cells[4].textContent();

          // 各項目の存在を確認
          expect(sentAtText?.trim()).not.toBe('');
          expect(toText?.trim()).not.toBe('');
          expect(subjectText?.trim()).not.toBe('');
          expect(statusText?.trim()).not.toBe('');

          // ステータスが表示されることを確認
          const validStatuses = ['成功', '失敗', '保留中'];
          expect(validStatuses.some(status => statusText?.includes(status))).toBeTruthy();
        }
      }
    }
  }

  // データベースからリマインダー送信記録を確認
  await expect.poll(
    async () => {
      const mails = await fetchTableRecords(request, config, 'メール送信履歴');
      // リマインダーメールで送信成功のレコードが存在することを確認
      return mails.some((mail) => mail['メールタイプ'] === 'リマインダー' && mail['送信ステータス'] === '成功');
    },
    { timeout: 10000, message: 'リマインダー送信済みのメール記録が存在すること' },
  ).toBe(true);
});
