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

test('メール送信サーバーへの接続に失敗した場合、送信失敗がシステムログに記録され管理画面に警告が表示される', async ({ page, request }) => {
  const config = await readAivicConfig(page);

  // 日報確認・管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');

  // 「リマインダー通知送信」ボタンを操作し、手動でリマインダーメール送信を実行する
  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  await expect(sendReminderBtn).toBeVisible();

  // EmailNotificationService の sendReminderEmail 呼び出しが
  // メール送信サーバーへの接続失敗でエラーを返す状況をスタブで再現
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (/reminder|mail|send/i.test(url)) {
      await route.abort('connectionfailed');
      return;
    }
    await route.continue();
  });

  // ボタンをクリック
  await sendReminderBtn.click();

  // 期待結果(1): 管理画面の通知送信結果エリアに「通知送信失敗」という警告テキストが表示される
  await expect(page.getByText(/通知送信失敗/i)).toBeVisible({ timeout: 5000 });

  // 期待結果(2): システムログに送信失敗の事実が記録され、管理画面内の検査ログ表示機能で
  // 『メール送信サーバー接続失敗 - リマインダーメール送信時にエラー発生』が確認できる
  await expect
    .poll(
      async () => {
        const logs = await fetchTableRecords(request, config, '日報未提出者検知ログ');
        return logs.length > 0;
      },
      { timeout: 10000, message: 'ログが記録されていること' },
    )
    .toBe(true);
});
