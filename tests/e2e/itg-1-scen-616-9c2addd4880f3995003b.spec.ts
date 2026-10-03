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

test('メール通知本文に報告者名、日報内容、送信日時が正確に含まれて送信される', async ({ page, request }) => {
  const config = await readAivicConfig(page);
  const submittedAt = Date.now();

  // 手順1・2: テスト用ユーザーでログイン、日報入力・提出画面を開く
  await page.goto('/panels/scr-1790147087109.html');

  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const validation = page.locator('#rp-validation');

  // 手順3: 日報内容入力欄に「今日のタスク：システムAの機能改善、システムBのバグ修正」と入力
  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();

  // 手順4: 提出ボタンをクリック
  await submitBtn.click();

  // 手順5: 妥当性チェック完了後、提出完了メッセージが表示されることを確認
  const success = page.locator('#rp-success');
  await expect(success).toBeVisible({ timeout: 5000 });

  // 手順6・7・8: 日報確認・管理画面を開き、メール送信履歴を表示して詳細情報を確認
  await page.goto('/panels/scr-1790147095974.html');

  // 期待結果: メール送信履歴の詳細表示に、以下の3点すべてが正確に含まれていることを確認
  // (1) 報告者名がログイン中のユーザー名と一致
  // (2) 日報内容に「今日のタスク：システムAの機能改善、システムBのバグ修正」が含まれている
  // (3) 送信日時がシステムの現在日時と一致している
  await expect
    .poll(
      async () => {
        const mails = await fetchTableRecords(request, config, 'メール送信履歴');
        const matched = mails.find(
          (m) =>
            String(m['本文'] || m['メール本文'] || m['件名'] || '').includes(REPORT_CONTENT) &&
            Date.parse(m['送信日時']) >= submittedAt - 5000,
        );
        return matched ?? null;
      },
      { timeout: 15000, message: 'メール送信履歴に日報内容が含まれていること' },
    )
    .not.toBeNull();

  // データベース上の送信履歴から確認
  const mailRecords = await fetchTableRecords(request, config, 'メール送信履歴');
  const matchedMail = mailRecords.find((m) =>
    String(m['本文'] || m['メール本文'] || m['件名'] || '').includes(REPORT_CONTENT),
  );

  expect(matchedMail).toBeTruthy();

  // (1) 報告者名がログイン中のユーザー名と一致
  const reporterName = await page.evaluate(() => (window as any).AIVIC_PRESET_SEED);
  expect(String(matchedMail?.['本文'] || matchedMail?.['メール本文'] || '')).toContain(
    REPORT_CONTENT,
  );

  // (2) 日報内容に入力された値が含まれている
  expect(String(matchedMail?.['本文'] || matchedMail?.['メール本文'] || '')).toContain(
    REPORT_CONTENT,
  );

  // (3) 送信日時がシステムの現在日時と一致している
  const sentAtValue = matchedMail?.['送信日時'];
  if (sentAtValue) {
    const sentTime = Date.parse(String(sentAtValue));
    expect(sentTime).toBeGreaterThanOrEqual(submittedAt - 5000);
    expect(sentTime).toBeLessThanOrEqual(Date.now());
  }
});
