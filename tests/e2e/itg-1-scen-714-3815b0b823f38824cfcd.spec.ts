import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-714: 報告者マスタの更新時に変更された項目だけが操作履歴に記録される
//
// panels/scr-1790147095974.html には「報告者マスタ管理」機能・操作履歴表示が存在せず、
// window.AIVIC_TABLES にも「操作履歴」テーブルは定義されていない
// （.aivic/batches/24/unresolved.md 参照）。本テストは仕様の文言に忠実な操作・検証を
// そのまま実装した。既存報告者（REP001、山田太郎、yamada@example.com、営業部）は
// 事前条件として window.AIVIC_API_URL 経由で「ユーザー」テーブルに用意する。

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

async function saveTableRecord(
  request: APIRequestContext,
  config: { apiUrl: string; appId: string; systemName: string; tables: AivicTableDef[] },
  tableName: string,
  record: Record<string, unknown>,
): Promise<void> {
  const tableIndex = config.tables.findIndex((t) => t.tableName === tableName);
  if (tableIndex < 0 || !config.apiUrl) return;
  const query =
    `?app=${encodeURIComponent(config.appId)}` +
    `&system=${encodeURIComponent(config.systemName)}` +
    `&table=${encodeURIComponent(tableName)}`;
  await request.post(`${config.apiUrl}/api/${tableIndex}${query}`, { data: record });
}

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者マスタの更新時に変更された項目だけが操作履歴に記録される', async ({ page, request }) => {
  const loginUser = 'leader_scen714';
  const oldName = '山田太郎';
  const newName = '山田花子';
  const email = 'yamada@example.com';
  const department = '営業部';

  await login(page, loginUser);
  const config = await readAivicConfig(page);

  // 前提: 既存の報告者レコード（REP001、山田太郎、yamada@example.com、営業部）を用意する
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'REP001',
    ユーザー名: 'REP001',
    メールアドレス: email,
    氏名: oldName,
    部門: department,
    役割: '一般',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });

  // 手順1: 日報確認・管理画面にログインし、報告者マスタ管理機能にアクセスする
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('報告者マスタ管理').click();

  // 手順2: 既存の報告者レコード（REP001）を開く
  const targetRow = page.getByRole('row', { name: new RegExp(oldName) });
  await targetRow.click();

  // 手順3: 名前のみを「山田花子」に変更し、他の項目は変更しない状態で保存する
  await page.getByLabel('氏名').fill(newName);
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText(/保存(が)?完了|更新されました/)).toBeVisible();

  // 手順4-5: 保存完了後、該当報告者の操作履歴を表示し、最新の更新レコードを確認する
  const historyRecords = await fetchTableRecords(request, config, '操作履歴');
  const matched = historyRecords
    .filter((r) => r['対象モジュール'] === '報告者マスタ' && r['操作種別'] === '更新')
    .sort((a, b) => Date.parse(b['実行日時'] ?? '') - Date.parse(a['実行日時'] ?? ''))[0];

  // 期待結果: 操作ユーザー・操作内容「更新」・変更項目「名前」のみが変更前値「山田太郎」→
  // 変更後値「山田花子」として記録され、メール・部門は記録されない。
  expect(matched).toBeTruthy();
  expect(matched?.['操作ユーザー']).toBe(loginUser);
  expect(matched?.['変更項目']).toBe('名前');
  expect(matched?.['変更前値']).toBe(oldName);
  expect(matched?.['変更後値']).toBe(newName);
  expect(JSON.stringify(matched)).not.toContain(email);
  expect(JSON.stringify(matched)).not.toContain(department);
});
