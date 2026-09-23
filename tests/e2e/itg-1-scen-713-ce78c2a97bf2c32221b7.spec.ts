import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-713: 報告者マスタの新規登録が操作履歴に記録される
//
// panels/scr-1790147095974.html には「報告者マスタ管理」機能が存在せず、window.AIVIC_TABLES
// にも「操作履歴」（変更履歴）という名前のテーブルは定義されていない（ユーザー・日報・
// 日報リマインダー設定・日報未提出者検知ログ・メール送信履歴の5テーブルのみ）。詳細設計
// （user-master-persistence.ts の persistReporterMasterChangeHistory 等）は変更履歴の記録を
// 定義しているが、対応する永続化テーブル・UIは存在しない。本テストは仕様の文言に忠実な
// 操作・検証をそのまま実装した。詳細は .aivic/batches/24/unresolved.md を参照。

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

test('報告者マスタの新規登録が操作履歴に記録される', async ({ page, request }) => {
  const loginUser = 'admin_scen713';

  // 手順1: 操作履歴記録機構がデータベースに接続済みであることを確認する（前提）
  await login(page, loginUser);
  const config = await readAivicConfig(page);

  // 手順2: 管理画面にアクセスし、報告者マスタ管理機能を開く
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('報告者マスタ管理').click();
  await page.getByRole('button', { name: '新規追加' }).click();

  // 手順3: 新しい報告者の登録情報を入力フォームに入力する
  const name = '操作履歴太郎';
  const email = 'scen713.history@example.com';
  await page.getByLabel('氏名').fill(name);
  await page.getByLabel('メールアドレス').fill(email);

  const beforeSave = new Date();

  // 手順4: 「保存」ボタンをクリックして報告者マスタの新規登録を実行する
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText(/保存(が)?完了|登録されました/)).toBeVisible();

  // 手順5: 操作履歴テーブルに対してクエリを実行し、直前に実行された操作レコードを取得する
  const historyRecords = await fetchTableRecords(request, config, '操作履歴');

  // 期待結果: 操作履歴テーブルに1件のレコードが記録され、操作種別='新規登録'、
  // 対象='報告者マスタ'、実行ユーザー=登録実行者ID、タイムスタンプが現在時刻と一致する。
  const matched = historyRecords.find(
    (r) => r['対象モジュール'] === '報告者マスタ' && r['操作種別'] === '新規登録' && r['実行ユーザー'] === loginUser,
  );
  expect(matched).toBeTruthy();
  expect(Date.parse(matched?.['実行日時'] ?? '')).toBeGreaterThanOrEqual(beforeSave.getTime() - 1000);
});
