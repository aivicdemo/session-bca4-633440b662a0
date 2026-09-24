import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-614: 日報送信時刻がシステムに自動記録され、送信完了判定が行われる。

const REPORT_CONTENT = 'SCEN-614検証用: 今日の業務内容を記録するテストケース';

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

test('日報送信時刻が記録され、送信完了と判定される', async ({ page, request }) => {
  await login(page, 'reporter_scen614');

  const config = await readAivicConfig(page);

  // 手順1: 送信基準時刻を記録する（以降、この時刻を「送信基準時刻」と呼ぶ）
  const submissionBaseTime = Date.now();

  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const validation = page.locator('#rp-validation');

  // 手順3: 業務内容入力欄に「今日の業務内容」を入力する
  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();

  // 手順4: 送信ボタンをクリックする
  await submitBtn.click();

  // 手順5: 妥当性チェック完了後、送信完了メッセージが画面に表示されるまで待機する
  const success = page.locator('#rp-success');
  await expect(success).toBeVisible({ timeout: 5000 });

  // 手順6: 送信完了メッセージが表示された時刻を記録する（以降、この時刻を「完了表示時刻」と呼ぶ）
  const completionDisplayTime = Date.now();

  // 手順7: 日報確認・管理画面にアクセスする
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順8: 提出済み日報一覧から、手順3で入力した内容に対応する日報レコードを検索する
  await page.locator('#rm-r-keyword').fill(REPORT_CONTENT);

  const matchingRow = page.locator('#rm-r-tbody tr', { hasText: REPORT_CONTENT });
  await expect(matchingRow).toHaveCount(1);

  // 手順9・10: 「送信時刻」と「ステータス」フィールドを確認する
  // 期待結果: 「送信時刻」が「送信基準時刻」以上かつ「完了表示時刻」以下の範囲内であり、
  // 「ステータス」が「送信完了」と表示されていること。
  // また、日報確認・管理画面の提出済み一覧に当該レコードが即座に表示されていること。

  const timestampCell = matchingRow.locator('td').nth(3);
  const timestampText = await timestampCell.textContent();
  const recordedTime = timestampText ? Date.parse(timestampText.trim().replace(' ', 'T')) : NaN;

  expect(recordedTime).toBeGreaterThanOrEqual(submissionBaseTime);
  expect(recordedTime).toBeLessThanOrEqual(completionDisplayTime);

  await expect(matchingRow).toContainText('送信完了');

  // データベースレコードでも送信時刻が記録されていることを確認
  await expect
    .poll(
      async () => {
        const reports = await fetchTableRecords(request, config, '日報');
        return reports.some(
          (r) =>
            String(r['業務内容'] || r['今日何をしたか'] || '').includes(
              REPORT_CONTENT.substring(0, 20),
            ) && r['送信時刻'],
        );
      },
      { timeout: 10000, message: 'データベースに送信時刻が記録されていること' },
    )
    .toBe(true);
});
