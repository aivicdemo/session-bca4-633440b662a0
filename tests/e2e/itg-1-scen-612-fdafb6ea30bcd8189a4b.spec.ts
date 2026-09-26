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

  // 前提: テスト用データベースをリセットし、リーダーのメールアドレスを有効な形式で登録する
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

  // ブラウザで日報入力・提出画面にアクセスする
  await login(page, 'reporter_scen612');

  const content = '顧客A向けシステム要件定義会議、議事録作成';
  const submittedAtTime = Date.now();
  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  // 「今日の業務内容」入力欄に内容を入力する
  await textarea.fill(content);

  // 「提出」ボタンをクリックする
  await submitBtn.click();

  // 日報が正常に送信され、画面に「日報を提出しました」というメッセージが表示されることを確認する
  await expect(page.locator('text=日報を提出しました')).toBeVisible();
  await expect(success).toBeVisible();

  // ページが日報確認・管理画面に遷移し、提出済み日報が一覧に表示されていることを確認する
  await page.locator('#rp-history-link').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const searchField = page.locator('#rm-r-keyword');
  if (await searchField.isVisible()) {
    await searchField.fill(content);
  }
  await expect(page.locator('#rm-r-tbody tr', { hasText: content })).toHaveCount(1);

  // リーダーのメールボックス（またはメール送信ログシステム）を確認し、メール通知が配信されていることを確認する
  await expect
    .poll(
      async () => {
        const mails = await fetchTableRecords(request, config, 'メール送信履歴');
        return mails.some(
          (m) => m['送信先メールアドレス'] === LEADER_EMAIL && Date.parse(m['送信日時']) >= submittedAtTime - 5000,
        );
      },
      { timeout: 15000, message: `リーダー宛（${LEADER_EMAIL}）にメール通知が配信されていること` },
    )
    .toBe(true);
});
