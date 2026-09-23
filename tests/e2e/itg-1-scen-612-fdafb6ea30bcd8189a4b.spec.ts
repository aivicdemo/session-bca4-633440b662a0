import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-612: リーダーのメールアドレスが有効な形式で登録されている場合、日報送信後に
// 「日報を提出しました」が表示され、管理画面に提出済み日報が記録され、
// リーダー「leader@example.com」宛にメール通知が配信される
// （daily-report-submission#triggerLeaderNotificationOnSubmission、
// email-notification-management#sendDailyReportSubmissionNotification に対応）。

const LEADER_EMAIL = 'leader@example.com';

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

async function saveTableRecord(
  request: APIRequestContext,
  config: { apiUrl: string; appId: string; systemName: string; tables: AivicTableDef[] },
  tableName: string,
  record: Record<string, unknown>,
): Promise<void> {
  const tableIndex = config.tables.findIndex((t) => t.tableName === tableName);
  if (tableIndex < 0 || !config.apiUrl) return;
  const query =
    `?app=${encodeURIComponent(config.appId)}` +
    `&system=${encodeURIComponent(config.systemName)}` +
    `&table=${encodeURIComponent(tableName)}`;
  await request.post(`${config.apiUrl}/api/${tableIndex}${query}`, { data: record });
}

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーのメールアドレスが有効な場合、日報提出後にメール通知が配信される', async ({ page, request }) => {
  await page.goto('/login.html');
  const config = await readAivicConfig(page);

  // 前提: リーダーのメールアドレスが有効な形式でユーザーマスタに登録されている。
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'usr-scen612-leader',
    ユーザー名: 'leader_scen612',
    メールアドレス: LEADER_EMAIL,
    氏名: 'リーダー太郎',
    部門: 'テスト部門',
    役割: 'マネージャー',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });

  await login(page, 'reporter_scen612');

  const content = '顧客A向けシステム要件定義会議、議事録作成';
  const submittedAt = Date.now();
  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  await textarea.fill(content);
  await submitBtn.click();

  await expect(page.getByText('日報を提出しました')).toBeVisible();
  await expect(success).toBeVisible();

  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.locator('#rm-r-keyword').fill(content);
  await expect(page.locator('#rm-r-tbody tr', { hasText: content })).toHaveCount(1);

  await expect
    .poll(
      async () => {
        const mails = await fetchTableRecords(request, config, 'メール送信履歴');
        return mails.some(
          (m) => m['送信先メールアドレス'] === LEADER_EMAIL && Date.parse(m['送信日時']) >= submittedAt - 5000,
        );
      },
      { timeout: 15000, message: `リーダー宛（${LEADER_EMAIL}）にメール通知が配信されていること` },
    )
    .toBe(true);
});
