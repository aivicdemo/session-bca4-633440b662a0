import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-715: 報告者マスタの更新操作で変更前後の値が同じとき、保存をスキップする
//
// panels/scr-1790147095974.html には「報告者マスタ管理」機能・編集フォームが存在しない
// （.aivic/batches/24/unresolved.md 参照）。本テストは仕様の文言に忠実な操作・検証を
// そのまま実装した。既存報告者（reporter_001、田中太郎、tanaka@example.com）は事前条件
// として window.AIVIC_API_URL 経由で「ユーザー」テーブルに用意し、保存後に該当レコードの
// 更新日時が変化していないこと（=更新が発生していないこと）をDBで確認する。

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

test('報告者マスタの更新操作で変更前後の値が同じとき、保存をスキップする', async ({ page, request }) => {
  const reporterId = 'reporter_001';
  const name = '田中太郎';
  const email = 'tanaka@example.com';
  const initialUpdatedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // ブラウザで日報確認・管理画面にアクセスし、管理者権限でログインする
  await login(page, 'admin_scen715');
  const config = await readAivicConfig(page);

  // 前提: 既存の報告者レコード（reporter_001、田中太郎、tanaka@example.com）を用意する
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: reporterId,
    ユーザー名: reporterId,
    メールアドレス: email,
    氏名: name,
    部門: '営業部',
    役割: '一般',
    ステータス: '有効',
    作成日時: initialUpdatedAt,
    更新日時: initialUpdatedAt,
    作成者: 'system',
  });

  // 手順2: 報告者マスタ管理機能を開く
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('報告者マスタ管理').click();

  // 手順3: 既存の報告者レコードを編集モードで開く
  const targetRow = page.getByRole('row', { name: new RegExp(name) });
  await targetRow.click();

  // 手順4: すべての入力項目を変更を加えずに現在値のままにする
  const nameInput = page.getByLabel('氏名');
  const emailInput = page.getByLabel('メールアドレス');
  await expect(nameInput).toHaveValue(name);
  await expect(emailInput).toHaveValue(email);

  // 手順5-6: 保存ボタンをクリックする。データベースへのUPDATE操作が実行されないか、
  // 実行されても影響行数が0であることをネットワークタブで確認する。
  let updateRequestSent = false;
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes(`/api/`)) {
      updateRequestSent = true;
    }
  });
  await page.getByRole('button', { name: '保存' }).click();

  // 手順7/期待結果: 画面に「保存完了」または「変更がありません」のいずれかのメッセージが表示される
  await expect(page.getByText(/保存完了|変更がありません/)).toBeVisible();

  // 期待結果: 報告者マスタレコードは一切更新されない（更新日時が変化しない）。
  const records = await fetchTableRecords(request, config, 'ユーザー');
  const persisted = records.find((r) => r['ユーザーID'] === reporterId);
  expect(persisted?.['更新日時']).toBe(initialUpdatedAt);
  if (updateRequestSent) {
    expect(persisted?.['更新日時']).toBe(initialUpdatedAt);
  }
});
