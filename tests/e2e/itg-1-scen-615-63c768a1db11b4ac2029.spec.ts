import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-615: バリデーション済みの日報内容がシステムデータベースに永続化される。

const REPORT_CONTENT = '顧客A社との打ち合わせ実施、要件定義書のドラフト作成';

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

test('提出した日報内容がデータベースに永続化され、管理画面で同じ内容が確認できる', async ({ page, request }) => {
  await login(page, 'reporter_scen615');
  const config = await readAivicConfig(page);

  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const validation = page.locator('#rp-validation');

  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();

  await submitBtn.click();

  // 手順4: バリデーション完了を示す確認メッセージが表示されることを確認する。
  const success = page.locator('#rp-success');
  await expect(success).toBeVisible({ timeout: 5000 });

  // 手順5: 画面が遷移し、提出完了状態に変わることを確認する。
  await expect(success).toContainText('提出');

  // データベースへの永続化を確認する。入力内容・報告者情報（ユーザーID）・提出日時が紐付いていること。
  await expect
    .poll(
      async () => {
        const records = await fetchTableRecords(request, config, '日報');
        return records.find((r) => r['業務内容'] === REPORT_CONTENT) ?? null;
      },
      { timeout: 15000, message: '日報内容がシステムデータベースに永続化されていること' },
    )
    .not.toBeNull();

  const reportRecords = await fetchTableRecords(request, config, '日報');
  const matchedReport = reportRecords.find((r) => r['業務内容'] === REPORT_CONTENT);
  expect(matchedReport).toBeTruthy();
  expect(matchedReport?.['ユーザーID']).toBeTruthy();
  expect(matchedReport?.['作成日時']).toBeTruthy();

  // 手順6・7: 日報確認・管理画面で該当ユーザーの提出日報が一覧に表示され、
  // 入力したテキスト内容が保存された状態で表示されることを確認する。
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  await page.locator('#rm-r-keyword').fill(REPORT_CONTENT);
  const matchingRow = page.locator('#rm-r-tbody tr', { hasText: REPORT_CONTENT });
  await expect(matchingRow).toHaveCount(1);

  await matchingRow.locator('.rm-detail-btn').click();
  const modalBody = page.locator('#rm-view-modal-body');
  await expect(modalBody).toContainText(REPORT_CONTENT);
});
