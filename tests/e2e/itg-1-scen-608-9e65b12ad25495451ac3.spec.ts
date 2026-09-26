import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-608: 定時期限（例：17:00）超過後の提出は受け付けられるが、記録日付は翌営業日（営業カレンダー適用）
// となる（business-day-deadline-judgment#isWithinSubmissionDeadline /
// daily-report-submission#validateDailyReportSubmissionEligibility の SubmissionDeadlineExceededError に対応）。
// 例に合わせ、金曜 2026-09-25 17:05 に提出し、記録日付が月曜 2026-09-28 となることを確認する。

const AFTER_DEADLINE_DATETIME = '2026-09-25T17:05:00+09:00';
const NEXT_BUSINESS_DAY = '2026-09-28';

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

test('定時期限超過後の提出は受け付けられ翌営業日の日付で記録される', async ({ page, request }) => {
  // システムの定時期限を超過した時刻に設定する（金曜 17:05）
  await page.clock.install({ time: new Date(AFTER_DEADLINE_DATETIME) });
  await login(page, 'reporter_scen608');
  const config = await readAivicConfig(page);

  const content = '本日の業務内容（定時期限超過提出）';
  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const success = page.locator('#rp-success');

  // 日報入力フィールドに内容を入力する
  await textarea.fill(content);

  // 提出ボタンを押す
  await submitBtn.click();

  // 妥当性チェックが完了し、提出確認ダイアログが表示されることを確認する
  const confirmDialog = page.getByRole('dialog').filter({ hasText: '提出確認' });
  if (await confirmDialog.isVisible().catch(() => false)) {
    // 提出確認ダイアログで確定ボタンを押す
    await confirmDialog.getByRole('button', { name: /確定/ }).click();
  }

  // 画面に「日報を受け付けました」というメッセージが表示されることを確認する
  await expect(page.locator('text=日報を受け付けました')).toBeVisible();
  await expect(success).toBeVisible();

  // 日報確認・管理画面に遷移し、その日報の記録日付を確認する
  await page.clock.setFixedTime(new Date(`${NEXT_BUSINESS_DAY}T09:00:00+09:00`));

  await page.locator('#rp-history-link').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const searchField = page.locator('#rm-r-keyword');
  if (await searchField.isVisible()) {
    await searchField.fill(content);
  }
  const matchingRow = page.locator('#rm-r-tbody tr', { hasText: content });

  // 記録日付が翌営業日（月曜）となっていることを確認する
  await expect(matchingRow).toContainText(NEXT_BUSINESS_DAY);

  const reportRecords = await fetchTableRecords(request, config, '日報');
  const matched = reportRecords.find((r) => r['業務内容'] === content);
  expect(String(matched?.['報告日'] ?? '')).toContain(NEXT_BUSINESS_DAY);
});
