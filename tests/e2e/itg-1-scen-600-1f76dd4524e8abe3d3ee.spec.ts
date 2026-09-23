import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-600: 報告者が有効な権限を持つ場合、日報入力画面から日報内容を入力して送信ボタンを押すと、
// 入力内容がバリデーション後、システムに記録されてリーダーへメール通知が送信される。

const REPORT_CONTENT = '本日はシステムテストを実施した';

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

test('報告者が日報を提出すると記録され、リーダーへ通知メールが送信される', async ({ page, request }) => {
  // 前提: 報告者ユーザーが日報提出権限を持つことを管理画面で確認する UI はサンプル画面に存在しないため、
  // ログイン可能であることをもって提出資格を持つ前提として扱う（.aivic/batches/1/unresolved.md 参照）。
  await login(page, 'reporter_scen600');

  const config = await readAivicConfig(page);
  const submittedAt = Date.now();

  const textarea = page.locator('#rp-content');
  const validation = page.locator('#rp-validation');
  const submitBtn = page.locator('#rp-submit-btn');

  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();

  await submitBtn.click();

  const mailStatus = page.locator('#rp-mail-status');
  const mailStatusText = page.locator('#rp-mail-status-text');
  await expect(mailStatus).toHaveClass(/is-visible/);
  await expect(mailStatusText).toHaveText('メール送信中...');

  await expect(mailStatus).toHaveClass(/is-done/, { timeout: 5000 });
  await expect(mailStatusText).toHaveText('送信完了');

  const success = page.locator('#rp-success');
  await expect(success).toBeVisible();
  await expect(success).toContainText('提出');
  await expect(success).toContainText('通知');

  const todayIso = new Date().toISOString().slice(0, 10);

  await expect
    .poll(
      async () => {
        const records = await fetchTableRecords(request, config, '日報');
        return records.find((r) => r['業務内容'] === REPORT_CONTENT) ?? null;
      },
      { timeout: 15000, message: '日報内容『本日はシステムテストを実施した』がシステムに記録されていること' },
    )
    .not.toBeNull();

  const reportRecords = await fetchTableRecords(request, config, '日報');
  const matchedReport = reportRecords.find((r) => r['業務内容'] === REPORT_CONTENT);
  expect(matchedReport).toBeTruthy();
  expect(String(matchedReport?.['報告日'] ?? '')).toContain(todayIso);

  await expect
    .poll(
      async () => {
        const mails = await fetchTableRecords(request, config, 'メール送信履歴');
        return mails.find(
          (m) =>
            typeof m['送信日時'] === 'string' &&
            Date.parse(m['送信日時']) >= submittedAt - 5000 &&
            (String(m['本文'] ?? '').includes(REPORT_CONTENT) || String(m['件名'] ?? '').includes(REPORT_CONTENT)),
        )
          ? true
          : false;
      },
      { timeout: 15000, message: 'リーダー宛の日報提出通知メールが送信履歴に記録されていること' },
    )
    .toBe(true);

  const mailRecords = await fetchTableRecords(request, config, 'メール送信履歴');
  const matchedMail = mailRecords.find(
    (m) => String(m['本文'] ?? '').includes(REPORT_CONTENT) || String(m['件名'] ?? '').includes(REPORT_CONTENT),
  );
  expect(matchedMail).toBeTruthy();
  expect(matchedMail?.['送信ステータス']).toBe('成功');

  await login(page, 'leader_scen600');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  await page.locator('#rm-r-keyword').fill(REPORT_CONTENT);

  const matchingRow = page.locator('#rm-r-tbody tr', { hasText: REPORT_CONTENT });
  await expect(matchingRow).toHaveCount(1);
  await expect(matchingRow).toContainText(todayIso);
});
