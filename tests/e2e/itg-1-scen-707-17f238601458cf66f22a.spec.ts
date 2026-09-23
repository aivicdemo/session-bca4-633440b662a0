import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-707: メールアドレスが正しい形式でないとき、保存をエラーで中断する
//
// panels/scr-1790147095974.html には「報告者マスタ管理」機能が存在しない
// （.aivic/batches/24/unresolved.md 参照）。本テストは仕様の文言に忠実な操作・検証を
// そのまま実装した。データベース状態が変更されていないことは window.AIVIC_API_URL 経由で
// 「ユーザー」テーブル（報告者マスタに相当）を確認することで検証する。

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

test('メールアドレスが正しい形式でないとき、保存をエラーで中断する', async ({ page, request }) => {
  await login(page, 'leader_scen707');
  const config = await readAivicConfig(page);
  const beforeRecords = await fetchTableRecords(request, config, 'ユーザー');

  // 手順1-2: 日報確認・管理画面にログインし、「報告者マスタ」または同等の設定メニューにアクセスする
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('報告者マスタ管理').click();

  // 手順3: 新規報告者を追加するフォームを開く
  await page.getByRole('button', { name: '新規追加' }).click();

  // 手順4: メールアドレス入力欄に不正な形式のメールアドレスを入力する
  const nameInput = page.getByLabel('氏名');
  const emailInput = page.getByLabel('メールアドレス');
  await nameInput.fill('不正メール太郎');
  const invalidEmail = 'user@example';
  await emailInput.fill(invalidEmail);

  // 手順5: 保存ボタンをクリックする
  await page.getByRole('button', { name: '保存' }).click();

  // 手順6/期待結果: 「メールアドレスの形式が正しくありません」または同等の日本語エラーメッセージが
  // 表示される。データベース状態は変更されず、画面は入力値が保持されたままの編集状態に留まる。
  await expect(page.getByText(/メールアドレスの形式が正しくありません/)).toBeVisible();
  await expect(emailInput).toHaveValue(invalidEmail);

  const afterRecords = await fetchTableRecords(request, config, 'ユーザー');
  expect(afterRecords.length).toBe(beforeRecords.length);
  expect(afterRecords.some((r) => r['メールアドレス'] === invalidEmail)).toBe(false);
});
