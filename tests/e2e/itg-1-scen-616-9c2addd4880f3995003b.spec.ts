import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-616: メール通知本文に報告者名、日報内容、送信日時が正確に含まれて送信される。

const REPORT_CONTENT = '今日のタスク：システムAの機能改善、システムBのバグ修正';

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

test('メール送信履歴の詳細に報告者名・日報内容・送信日時が正確に反映されている', async ({ page, request }) => {
  const reporterName = 'reporter_scen616';
  await login(page, reporterName);

  const config = await readAivicConfig(page);
  const submittedAt = Date.now();

  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const validation = page.locator('#rp-validation');

  // 手順3: 日報内容入力欄に指定されたテキストを入力する
  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();

  // 手順4: 提出ボタンをクリックする
  await submitBtn.click();

  // 手順5: 妥当性チェック完了後、提出完了メッセージが表示されることを確認する
  const success = page.locator('#rp-success');
  await expect(success).toBeVisible({ timeout: 5000 });

  // 手順6・7・8: 日報確認・管理画面を開き、メール送信履歴を表示して詳細情報を確認する
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // メール送信履歴タブをクリック
  await page.locator('button:has-text("メール送信履歴")').click();

  // 期待結果: メール送信履歴の詳細表示に、以下の3点すべてが正確に含まれていることを確認
  await expect
    .poll(
      async () => {
        const mails = await fetchTableRecords(request, config, 'メール送信履歴');
        return mails.find(
          (m) =>
            String(m['日報内容'] || m['メール本文'] || '').includes(REPORT_CONTENT) &&
            Date.parse(m['送信日時']) >= submittedAt - 5000,
        ) ?? null;
      },
      { timeout: 15000, message: 'メール送信履歴に日報内容が含まれていること' },
    )
    .not.toBeNull();

  const mailRecords = await fetchTableRecords(request, config, 'メール送信履歴');
  const matchedMail = mailRecords.find((m) =>
    String(m['日報内容'] || m['メール本文'] || '').includes(REPORT_CONTENT),
  );

  // (1) 報告者名がログイン中のユーザー名と一致
  expect(String(matchedMail?.['報告者名'] || matchedMail?.['送信者'] || '')).toContain(reporterName);
  // (2) 日報内容に入力された値が含まれている
  expect(String(matchedMail?.['日報内容'] || matchedMail?.['メール本文'] || '')).toContain(
    REPORT_CONTENT,
  );
  // (3) 送信日時がシステムの現在日時と一致している
  const sentAtValue = Date.parse(String(matchedMail?.['送信日時'] || ''));
  expect(sentAtValue).toBeGreaterThanOrEqual(submittedAt - 5000);
  expect(sentAtValue).toBeLessThanOrEqual(Date.now());
});
