import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

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
  await page.waitForURL(/panels\/(scr-1790147087109|scr-1790147095974)\.html/);
}

test('SCEN-714: 報告者マスタの更新時に変更された項目だけが操作履歴に記録される', async ({ page, request }) => {
  // 1. 日報確認・管理画面にログイン
  await login(page, 'leader_scen714');
  const config = await readAivicConfig(page);

  // 前提: 既存の報告者レコード（REP001、山田太郎、yamada@example.com、営業部）を準備
  const reporterId = 'REP001';
  const originalName = '山田太郎';
  const updatedName = '山田花子';
  const email = 'yamada@example.com';
  const department = '営業部';

  // 2. 管理画面を開く
  await page.goto('/panels/scr-1790147095974.html');
  await expect(page.locator('.rm-heading')).toBeVisible();

  // 3. 名前のみを「山田花子」に変更し、他の項目（メール、部門）は変更しない状態で保存
  // サンプル画面では報告者マスタ UI が実装されていないため、API 経由で実行
  const updateResponse = await request.post(`${config.apiUrl}/api/update-reporter`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      app: config.appId,
      reporterId,
      reporterName: updatedName,
      // メール、部門は変更しない（元の値のまま）
      email,
      department,
    },
  });

  // 4. 保存完了後、該当報告者の操作履歴を表示する
  const auditLogs = await fetchTableRecords(request, config, 'ユーザー');

  // 5. 操作履歴一覧から、最新の更新レコードを確認
  expect(auditLogs.length).toBeGreaterThan(0);
  const latestRecord = auditLogs[auditLogs.length - 1];

  // 期待結果：操作履歴に以下の内容が記録されていること
  // - 操作日時：現在時刻
  expect(latestRecord['実行日時']).toBeTruthy();

  // - 操作ユーザー：ログインユーザー名
  expect(latestRecord['実行ユーザー']).toBe('leader_scen714');

  // - 操作内容：「更新」
  expect(latestRecord['操作種別']).toBe('更新');

  // - 変更項目：「名前」のみが表示され、変更前値「山田太郎」→変更後値「山田花子」と記録される
  const changeDiff = latestRecord['変更内容'] || latestRecord['差分'] || '';
  expect(changeDiff).toContain('名前');
  expect(changeDiff).toContain('山田太郎');
  expect(changeDiff).toContain('山田花子');

  // - メール、部門などの変更されなかった項目は操作履歴に記録されない
  expect(changeDiff).not.toContain('メール');
  expect(changeDiff).not.toContain('部門');
});
