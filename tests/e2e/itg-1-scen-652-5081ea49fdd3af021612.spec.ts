import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-652: 提出期限の時刻が設定されていないとき、エラーメッセージ
// 「提出期限が設定されていません。システム管理者に連絡してください」が表示され、
// 未提出者検知処理が開始されず、EmailNotificationService の sendNonSubmissionAlert は
// 呼び出されない。画面遷移は発生せず、リマインダー設定管理画面に留まる。

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
  await page.waitForURL(/\/index\.html/);
}

test('提出期限の時刻が未設定のとき未提出者検知でエラーが表示される', async ({ page, request }) => {
  // 前提: システム管理者権限でログインする。
  await login(page, 'admin_scen652');
  const config = await readAivicConfig(page);

  // 日報確認・管理画面へ移動
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');
  const managementUrl = page.url();

  const mailBefore = await fetchTableRecords(request, config, 'メール送信履歴');

  // リマインダー設定管理画面（設定モーダル）を開く。
  await page.locator('#rm-settings-btn').click();
  await expect(page.locator('#rm-settings-modal')).toHaveClass(/is-visible/);

  // 提出期限の時刻フィールドを空白（未設定）にする。
  const timeField = page.locator('#rm-set-time');
  await timeField.fill('');

  // 未提出者検知機能の実行トリガーを操作する。
  await page.locator('#rm-settings-save').click();

  // 画面上にエラーメッセージが表示されるまで待機する。
  await expect(
    page.getByText('提出期限が設定されていません。システム管理者に連絡してください'),
  ).toBeVisible();

  // 画面遷移は発生せず、リマインダー設定管理画面に留まる。
  expect(page.url()).toBe(managementUrl);

  // 未提出者検知処理が開始されず、EmailNotificationService の sendNonSubmissionAlert は
  // 呼び出されない（メール送信履歴に新規レコードが追加されないことを代替的に確認する）。
  const mailAfter = await fetchTableRecords(request, config, 'メール送信履歴');
  expect(mailAfter.length).toBe(mailBefore.length);
});
