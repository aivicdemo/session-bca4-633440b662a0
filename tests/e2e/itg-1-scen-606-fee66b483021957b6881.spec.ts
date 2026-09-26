import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-606: 報告者がいずれのチームリーダーの管理下にもない場合、送信ボタン押下後に
// 「エラー：このユーザーは管理チームに所属していないため、日報の送信ができません」が表示され、
// 日報は登録されずメール通知も送信されない。日報確認・管理画面の提出済み日報一覧にも記録されない
// （reporter-master-management 系のチーム所属検証に対応）。

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

test('管理チームに所属していない報告者は日報送信がエラーとなる', async ({ page, request }) => {
  // 前提: テストユーザーが「社員」ロールでログインし、所属チームにチームリーダーが設定されていない
  await login(page, 'user_a_no_leader_team');
  const config = await readAivicConfig(page);

  const content = '顧客A社との打ち合わせを実施';
  const mailBefore = await fetchTableRecords(request, config, 'メール送信履歴');
  const reportsBefore = await fetchTableRecords(request, config, '日報');

  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  await textarea.fill(content);

  // 送信ボタンをクリック
  await submitBtn.click();

  // エラーメッセージが表示される
  await expect(
    page.locator('text=エラー：このユーザーは管理チームに所属していないため、日報の送信ができません'),
  ).toBeVisible();

  // 入力内容が保持されている
  await expect(textarea).toHaveValue(content);

  // 成功メッセージは表示されない
  await expect(success).not.toBeVisible();

  // メール通知は送信されていない
  const mailAfter = await fetchTableRecords(request, config, 'メール送信履歴');
  expect(mailAfter.length).toBe(mailBefore.length);

  // 日報は業務システムに登録されていない
  const reportsAfter = await fetchTableRecords(request, config, '日報');
  expect(reportsAfter.find((r) => r['業務内容'] === content)).toBeUndefined();
  expect(reportsAfter.length).toBe(reportsBefore.length);

  // 日報確認・管理画面の「提出済み日報一覧」に記録されていない
  await page.locator('#rp-history-link').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const searchField = page.locator('#rm-r-keyword');
  if (await searchField.isVisible()) {
    await searchField.fill(content);
  }
  await expect(page.locator('#rm-r-tbody tr', { hasText: content })).toHaveCount(0);
});
