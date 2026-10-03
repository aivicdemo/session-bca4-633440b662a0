import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

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

test('リーダーのメールアドレスが有効な形式で登録されている場合、日報送信後にメール通知が正常に送信される', async ({ page, request }) => {
  const config = await readAivicConfig(page);

  // ブラウザで日報入力・提出画面にアクセス
  await page.goto('/panels/scr-1790147087109.html');

  const content = '顧客A向けシステム要件定義会議、議事録作成';
  const submittedAtTime = Date.now();
  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  // 「今日の業務内容」入力欄に「顧客A向けシステム要件定義会議、議事録作成」と入力
  await textarea.fill(content);

  // 「提出」ボタンをクリック
  await submitBtn.click();

  // 日報が正常に送信され、画面に「日報を提出しました」というメッセージが表示されることを確認
  await expect(page.locator('text=日報を提出しました')).toBeVisible();
  await expect(success).toBeVisible();

  // ページが日報確認・管理画面に遷移し、提出済み日報が一覧に表示されていることを確認
  await page.locator('#rp-history-link').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // リーダーのメールボックス（またはメール送信ログシステム）を確認し、
  // リーダーのメールアドレス「leader@example.com」宛にメール通知が配信されていることを確認
  await expect
    .poll(
      async () => {
        const mails = await fetchTableRecords(request, config, 'メール送信履歴');
        return mails.some((m) => {
          const toEmail = m['送信先メールアドレス'];
          const sendTime = m['送信日時'];
          const isLeaderEmail = toEmail === LEADER_EMAIL || (typeof toEmail === 'string' && toEmail.includes(LEADER_EMAIL));
          const isSentAfterSubmission = sendTime && Date.parse(sendTime) >= submittedAtTime - 5000;
          return isLeaderEmail && isSentAfterSubmission;
        });
      },
      { timeout: 15000, message: `リーダー宛（${LEADER_EMAIL}）にメール通知が配信されていること` },
    )
    .toBe(true);
});
