import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-610: リーダーのメールアドレスが登録されていない場合、日報自体は提出処理されるが、
// 画面上に警告『メール通知の送信に失敗しました。リーダーのメールアドレスが登録されていません。
// 管理者にご連絡ください。』が表示され、メール送信は実行されない
// （email-notification-management#sendDailyReportSubmissionNotification の
// LeaderEmailAddressNotFoundError に対応）。

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
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーのメールアドレス未登録の場合、日報は提出されるがメール通知は失敗し警告が表示される', async ({
  page,
  request,
}) => {
  // テストユーザーでログイン
  await login(page, 'reporter_scen610');
  const config = await readAivicConfig(page);

  const content = 'リーダーメール未登録テスト用の日報内容記入';
  const mailBefore = await fetchTableRecords(request, config, 'メール送信履歴');

  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  // 日報内容を入力して提出する
  await textarea.fill(content);
  await submitBtn.click();

  // 画面上に警告メッセージが表示される
  await expect(
    page.locator(
      'text=メール通知の送信に失敗しました。リーダーのメールアドレスが登録されていません。管理者にご連絡ください。',
    ),
  ).toBeVisible();

  // メール送信は実行されていない
  const mailAfter = await fetchTableRecords(request, config, 'メール送信履歴');
  expect(mailAfter.find((m) => String(m['本文'] ?? '').includes(content))).toBeUndefined();
  expect(mailAfter.length).toBe(mailBefore.length);
});
