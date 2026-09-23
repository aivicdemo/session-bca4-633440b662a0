import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-708: 入力したメールアドレスが既に登録されているとき、保存をエラーで中断する
//
// panels/scr-1790147095974.html には「報告者マスタ管理」機能・保存画面が存在しない
// （.aivic/batches/24/unresolved.md 参照）。本テストは仕様の文言に忠実な操作・検証を
// そのまま実装した。「既に登録済みのメールアドレス」という前提は、window.AIVIC_API_URL
// 経由で「ユーザー」テーブル（報告者マスタに相当）に事前レコードを保存して用意する。

const EXISTING_EMAIL = 'user1@example.com';

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

test('入力したメールアドレスが既に登録されているとき、保存をエラーで中断する', async ({ page, request }) => {
  await login(page, 'leader_scen708');
  const config = await readAivicConfig(page);

  // 前提: 既に登録済みのメールアドレス（user1@example.com）を持つ報告者を用意する。
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'usr-scen708-existing',
    ユーザー名: 'user1_scen708',
    メールアドレス: EXISTING_EMAIL,
    氏名: '既存太郎',
    部門: '既存部',
    役割: '一般',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });
  const beforeRecords = await fetchTableRecords(request, config, 'ユーザー');

  // 手順1: 報告者マスタ保存画面にアクセスする
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('報告者マスタ管理').click();
  await page.getByRole('button', { name: '新規追加' }).click();

  // 手順2-3: 既に登録済みのメールアドレスをメールアドレス入力フィールドに入力し、必須項目を入力する
  const nameInput = page.getByLabel('氏名');
  const emailInput = page.getByLabel('メールアドレス');
  await emailInput.fill(EXISTING_EMAIL);
  await nameInput.fill('重複太郎');

  // 手順4-5: 「保存」ボタンをクリックし、エラーメッセージが表示されるまで待機する
  await page.getByRole('button', { name: '保存' }).click();

  // 期待結果: 「このメールアドレスは既に登録されています」または同等の重複エラーメッセージが表示され、
  // 保存処理が中断される。報告者マスタに新規レコードが追加されない。
  await expect(page.getByText(/このメールアドレスは既に登録されています/)).toBeVisible();
  await expect(emailInput).toHaveValue(EXISTING_EMAIL);
  await expect(nameInput).toHaveValue('重複太郎');

  const afterRecords = await fetchTableRecords(request, config, 'ユーザー');
  expect(afterRecords.length).toBe(beforeRecords.length);
});
