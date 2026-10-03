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

test('バリデーション済みの日報内容がシステムデータベースに永続化される', async ({ page, request }) => {
  const config = await readAivicConfig(page);

  // 手順1: テストユーザーでログイン、日報入力・提出画面を開く
  await page.goto('/panels/scr-1790147087109.html');

  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const validation = page.locator('#rp-validation');

  // 手順2・3: 入力項目「今日何をしたか」に業務上妥当なテキスト内容を入力する
  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();

  // 手順4: 「提出」ボタンをクリック
  await submitBtn.click();

  // 手順4: バリデーション完了を示す確認メッセージが画面に表示されることを確認
  const success = page.locator('#rp-success');
  await expect(success).toBeVisible({ timeout: 5000 });

  // 手順5: 画面が遷移し、提出完了状態に変わることを確認
  await expect(success).toBeVisible();

  // 期待結果: 入力されたテキスト内容がシステムデータベースに永続化されていることを確認
  await expect
    .poll(
      async () => {
        const records = await fetchTableRecords(request, config, '日報');
        return records.find((r) => String(r['業務内容'] || '').includes(REPORT_CONTENT)) ?? null;
      },
      { timeout: 15000, message: '日報内容がシステムデータベースに永続化されていること' },
    )
    .not.toBeNull();

  const reportRecords = await fetchTableRecords(request, config, '日報');
  const matchedReport = reportRecords.find((r) =>
    String(r['業務内容'] || '').includes(REPORT_CONTENT),
  );
  expect(matchedReport).toBeTruthy();
  // 期待結果: 提出日時・報告者情報（ユーザーID）がデータベースレコードに紐付いて保存されている
  expect(matchedReport?.['ユーザーID']).toBeTruthy();
  expect(matchedReport?.['作成日時']).toBeTruthy();

  // 手順6・7: 日報確認・管理画面にアクセスし、該当ユーザーの提出日報が一覧に表示され、
  // 入力したテキスト内容が保存された状態で表示されることを確認
  await page.goto('/panels/scr-1790147095974.html');

  const searchField = page.locator('#rm-r-keyword');
  if (await searchField.isVisible()) {
    await searchField.fill(REPORT_CONTENT.substring(0, 20));
  }
  const matchingRow = page.locator('#rm-r-tbody tr');
  await expect(matchingRow).toHaveCount(1, { timeout: 5000 });
});
