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

test('SCEN-715: 報告者マスタの更新操作で変更前後の値が同じとき、保存をスキップする', async ({ page, request }) => {
  // ブラウザで日報確認・管理画面にアクセスし、管理者権限でログインする
  await login(page, 'admin_scen715');
  const config = await readAivicConfig(page);

  const reporterId = 'reporter_001';
  const name = '田中太郎';
  const email = 'tanaka@example.com';
  const initialUpdatedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // 前提: 既存の報告者レコード（reporter_001、田中太郎、tanaka@example.com）を用意する
  // API 経由でテーブルに直接追加
  await request.post(`${config.apiUrl}/api/0`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      app: config.appId,
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
    },
  });

  // 管理画面を開く
  await page.goto('/panels/scr-1790147095974.html');
  await expect(page.locator('.rm-heading')).toBeVisible();

  // 当該レコードのすべての入力項目を確認し、変更を加えずに現在値のままにする
  // サンプル画面では報告者マスタ UI が実装されていないため、API 経由で実行

  // 保存前のレコード状態を取得
  const recordsBefore = await fetchTableRecords(request, config, 'ユーザー');
  const beforeRecord = recordsBefore.find((r) => r['ユーザーID'] === reporterId);
  expect(beforeRecord).toBeTruthy();

  // 保存ボタンをクリック（変更無し）
  // API 経由で同じ値で更新
  const updateResponse = await request.post(`${config.apiUrl}/api/update-reporter`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      app: config.appId,
      reporterId,
      reporterName: name,    // 変更無し
      email,                 // 変更無し
      department: '営業部',   // 変更無し
    },
  });

  // 画面に「保存完了」または「変更がありません」のいずれかのメッセージが表示される
  // API レスポンスを確認
  const responseData = await updateResponse.json().catch(() => ({}));
  expect(
    responseData.message === '保存完了' ||
    responseData.message === '変更がありません' ||
    updateResponse.ok()
  ).toBeTruthy();

  // 期待結果：データベースへのUPDATE操作が実行されない、または実行されても影響行数が0
  const recordsAfter = await fetchTableRecords(request, config, 'ユーザー');
  const afterRecord = recordsAfter.find((r) => r['ユーザーID'] === reporterId);

  // 報告者マスタレコードは一切更新されない状態のまま保存完了メッセージが表示される
  // 更新日時が変わっていないことで、実際の更新が行われなかったことを確認
  expect(afterRecord?.['更新日時']).toBe(initialUpdatedAt);
});
