import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-711: 報告者マスタの変更がデータベースに保存される
//
// panels/scr-1790147095974.html には「報告者マスタ管理」セクション・編集フォーム・
// 更新成功メッセージのいずれも存在しない（.aivic/batches/24/unresolved.md 参照）。本
// テストは仕様の文言に忠実な操作・検証をそのまま実装し、リロード後の永続化確認は画面
// 表示に加えて window.AIVIC_API_URL 経由で「ユーザー」テーブル（報告者マスタに相当）を
// 直接確認することで補強する。

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

test('報告者マスタの変更がデータベースに保存される', async ({ page, request }) => {
  const oldEmail = 'user01@old.com';
  const newEmail = 'user01@new.com';

  await login(page, 'admin_scen711');
  const config = await readAivicConfig(page);

  // 前提: 管理者権限で正常にログインできたこと（5人のうち1人）を用意する。
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'usr-scen711-01',
    ユーザー名: 'user01_scen711',
    メールアドレス: oldEmail,
    氏名: '報告者01',
    部門: '営業部',
    役割: '一般',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });
  for (let i = 2; i <= 5; i += 1) {
    await saveTableRecord(request, config, 'ユーザー', {
      ユーザーID: `usr-scen711-0${i}`,
      ユーザー名: `user0${i}_scen711`,
      メールアドレス: `user0${i}@old.com`,
      氏名: `報告者0${i}`,
      部門: '営業部',
      役割: '一般',
      ステータス: '有効',
      作成日時: new Date().toISOString(),
      更新日時: new Date().toISOString(),
      作成者: 'system',
    });
  }

  // 手順2: 画面内の報告者マスタ管理セクションを開く
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('報告者マスタ管理').click();

  // 手順3: 既存の報告者1名の情報を選択し、メールアドレスを変更する
  const targetRow = page.getByRole('row', { name: /報告者01/ });
  await targetRow.click();
  const emailInput = page.getByLabel('メールアドレス');
  await emailInput.fill(newEmail);

  // 手順4: 変更内容を保存ボタンで送信する
  await page.getByRole('button', { name: '保存' }).click();

  // 手順5/期待結果: 「報告者情報が更新されました」等の保存成功メッセージが表示される
  await expect(page.getByText(/報告者情報が更新されました|更新されました/)).toBeVisible();

  // 手順6: ブラウザをリロードして日報確認・管理画面に再度アクセスする
  await page.reload();
  await page.getByText('報告者マスタ管理').click();

  // 手順7/期待結果: 変更した報告者の情報を確認し、メールアドレスが新しい値で表示されていることを確認する
  const reloadedRow = page.getByRole('row', { name: /報告者01/ });
  await expect(reloadedRow).toContainText(newEmail);

  // データベースへの永続化確認
  const records = await fetchTableRecords(request, config, 'ユーザー');
  const updated = records.find((r) => r['ユーザーID'] === 'usr-scen711-01');
  expect(updated?.['メールアドレス']).toBe(newEmail);
});
