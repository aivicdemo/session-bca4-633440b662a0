import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-601: 報告内容が空または空白のみの場合、送信が阻止されてエラーメッセージ「報告内容は必須項目です」が
// 表示され、日報は未提出のまま留まる（daily-report-submission#validateDailyReportContentQuality 等が対象）。

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

test('報告内容が空白のみの場合、送信が阻止されエラーメッセージが表示される', async ({ page, request }) => {
  await login(page, 'reporter_scen601');
  const config = await readAivicConfig(page);

  const mailBefore = await fetchTableRecords(request, config, 'メール送信履歴');

  const textarea = page.locator('#rp-content');
  const validation = page.locator('#rp-validation');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  // 空白文字のみ（スペース、タブ）を入力する
  await textarea.fill('   \t  ');

  // 送信ボタンをクリック
  await submitBtn.click();

  // エラーメッセージが表示される
  await expect(validation).toContainText('報告内容は必須項目です');

  // 成功メッセージは表示されない
  await expect(success).not.toBeVisible();

  // 画面は入力画面のままである
  await expect(page).toHaveURL(/panels\/scr-1790147087109\.html/);

  // メール送信は行われていない
  const mailAfter = await fetchTableRecords(request, config, 'メール送信履歴');
  expect(mailAfter.length).toBe(mailBefore.length);
});
