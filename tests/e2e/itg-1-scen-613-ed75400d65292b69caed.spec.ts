import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-613: メール送信サーバーへの接続に失敗した場合、送信失敗がシステムログに記録され
// 管理画面に警告が表示される。

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
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
}

test('メール送信サーバーへの接続に失敗した場合、送信失敗の警告とログが確認できる', async ({ page, request }) => {
  // 管理者ユーザーで日報確認・管理画面にログイン
  await login(page, 'admin_yamada');

  const config = await readAivicConfig(page);

  // EmailNotificationService.sendReminderEmail がメール送信サーバーへの接続失敗を返す状況を
  // 通信レベルでスタブして再現
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (/メール|mail|reminder|send/i.test(url)) {
      await route.abort('connectionfailed');
      return;
    }
    await route.continue();
  });

  // リマインダー通知送信ボタンを操作して手動でリマインダーメール送信を実行
  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  await expect(sendReminderBtn).toBeVisible();

  // ボタンをクリック
  await sendReminderBtn.click();

  // 期待結果(1): 通知送信結果エリアに「通知送信失敗」という警告テキストが表示される
  await expect(page.getByText(/通知送信失敗/i)).toBeVisible({ timeout: 5000 });

  // 期待結果(2): 検査ログ表示機能で該当のエラー内容が確認できる
  // ログテーブルに移動またはログ確認機能で検索
  await expect
    .poll(
      async () => {
        const logs = await fetchTableRecords(request, config, '検知ログ');
        return logs.some((l) =>
          String(l['検知内容'] || l['ステータス'] || '').includes('メール送信サーバー接続失敗'),
        );
      },
      { timeout: 10000, message: '検知ログに送信失敗が記録されていること' },
    )
    .toBe(true);
});
