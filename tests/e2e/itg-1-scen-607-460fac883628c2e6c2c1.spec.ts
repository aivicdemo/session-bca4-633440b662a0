import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-607: 営業日外（休業日・祝日）に提出した日報は受け付けられるが、記録日付は翌営業日となる
// （business-day-deadline-judgment#judgeBusinessDayAndDeadline / isBusinessDay に対応）。
// システム日時は祝日相当の非営業日（土曜 2026-09-19）から翌営業日（月曜 2026-09-21）へ進める。

const HOLIDAY_DATETIME = '2026-09-19T10:00:00+09:00';
const NEXT_BUSINESS_DAY_DATETIME = '2026-09-21T09:00:00+09:00';
const NEXT_BUSINESS_DAY = '2026-09-21';

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

test('営業日外に提出した日報は翌営業日の日付で記録される', async ({ page, request }) => {
  // システム日時を営業日外（祝日）に設定する
  await page.clock.install({ time: new Date(HOLIDAY_DATETIME) });
  await login(page, 'reporter_scen607');
  const config = await readAivicConfig(page);

  const content = '祝日提出テスト業務内容の記録確認';
  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  // 日報入力・提出画面で、入力項目に日報内容を入力する
  await textarea.fill(content);

  // 提出ボタンをクリックして日報を提出する
  await submitBtn.click();

  // 画面上に提出完了メッセージが表示されることを確認する
  await expect(success).toBeVisible();
  await expect(page.locator('#rp-validation.is-error')).toHaveCount(0);

  // システム日時を翌営業日に進める
  await page.clock.setFixedTime(new Date(NEXT_BUSINESS_DAY_DATETIME));

  // 日報確認・管理画面にアクセスする
  await page.locator('#rp-history-link').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 提出済み日報一覧から、提出した日報を検索して、記録日付が翌営業日になっていることを確認する
  const searchField = page.locator('#rm-r-keyword');
  if (await searchField.isVisible()) {
    await searchField.fill(content);
  }
  const matchingRow = page.locator('#rm-r-tbody tr', { hasText: content });
  await expect(matchingRow).toContainText(NEXT_BUSINESS_DAY);

  // 記録日付フィールドに翌営業日の日付が表示される
  const reportRecords = await fetchTableRecords(request, config, '日報');
  const matched = reportRecords.find((r) => r['業務内容'] === content);
  expect(String(matched?.['報告日'] ?? '')).toContain(NEXT_BUSINESS_DAY);
});
