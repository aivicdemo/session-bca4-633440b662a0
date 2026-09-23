import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-611: リーダーのメールアドレスの形式が不正な場合、日報はデータベースに保存された後、
// メール通知処理が実行されるが送信されず、画面上に警告
// 「リーダーのメールアドレスが不正な形式です。メール通知は送信されていません。」
// （またはこれに相当する業務上明確なメッセージ）が表示される
// （email-notification-management#validateEmailAddressForDelivery の InvalidEmailFormatError、
// sendDailyReportSubmissionNotification の LeaderEmailAddressInvalidError に対応）。
// 仕様は「リーダーのメールアドレス欄」への入力を求めるが、panels/scr-1790147087109.html には
// 報告内容欄（#rp-content）以外の入力欄が存在しないため、該当欄が見つかる場合のみ入力する。

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

test('リーダーのメールアドレスが不正な形式の場合、メール通知は送信されず警告が表示される', async ({
  page,
  request,
}) => {
  await login(page, 'reporter_scen611');
  const config = await readAivicConfig(page);

  const content = '業務A、業務Bを実施';
  const invalidLeaderEmail = 'leader@invalid';

  const textarea = page.locator('#rp-content');
  await textarea.fill(content);

  const leaderEmailInput = page.locator(
    'input[placeholder*="リーダー"], input[aria-label*="リーダー"], #rp-leader-email',
  );
  if (await leaderEmailInput.first().isVisible().catch(() => false)) {
    await leaderEmailInput.first().fill(invalidLeaderEmail);
  }

  const mailBefore = await fetchTableRecords(request, config, 'メール送信履歴');

  await page.locator('#rp-submit-btn').click();

  await expect(page.getByText(/リーダーのメールアドレスが.*(不正|無効).*形式/)).toBeVisible();
  await expect(page.getByText(/メール(通知)?は?送信されていません/)).toBeVisible();

  const mailAfter = await fetchTableRecords(request, config, 'メール送信履歴');
  expect(mailAfter.find((m) => m['送信先メールアドレス'] === invalidLeaderEmail)).toBeUndefined();
  expect(mailAfter.length).toBe(mailBefore.length);
});
