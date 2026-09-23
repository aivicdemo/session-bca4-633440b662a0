import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-684: 選択された未提出者がシステムで有効な報告者として登録されていることが確認される。
//
// panels/scr-1790147095974.html・panels/scr-1790147087109.html のいずれにも「ユーザーマスタ画面」に相当するUIは
// 存在しない（ナビゲーションは「日報入力・提出」「日報確認・管理」の2画面のみ）。ui-reference.md の案内に従い、
// window.AIVIC_API_URL 経由でユーザーテーブルを問い合わせることで代替検証する。また、未提出者一覧（missing 配列）
// は氏名が固定のモック値（高橋次郎・伊藤三郎・渡辺恵子）であり、window.AIVIC_PRESET_SEED のユーザーテーブルの
// 氏名（山田太郎・田中太郎・田中花子・鈴木花子・鈴木由紀）とは一致しない。そのため「ユーザーマスタで『有効』
// ステータスとして登録されている」ことの突合が現状のサンプル実装では成立しない可能性が高い。詳細は
// .aivic/batches/19/unresolved.md を参照。

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

test('未提出者一覧で選択した報告者がユーザーマスタで有効ステータスであることが確認できる', async ({ page, request }) => {
  // 日報確認・管理画面にログインする
  await login(page, 'admin_scen684');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 定時自動検知により未提出者一覧が表示されていることを確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);

  // 未提出者一覧から1名以上の報告者を選択する
  const targetRow = rows.first();
  await targetRow.locator('.rm-missing-checkbox').check();

  // 選択された報告者の名前またはIDをメモする
  const targetName = (await targetRow.locator('td').nth(1).textContent())?.trim() ?? '';
  expect(targetName.length).toBeGreaterThan(0);

  // ユーザーマスタ画面を開き、メモした報告者が『有効』ステータスで登録されていることを確認する
  // （ユーザーマスタ画面自体が存在しないため、window.AIVIC_API_URL 経由でユーザーテーブルを問い合わせて代替する）
  const config = await readAivicConfig(page);
  const userRecords = await fetchTableRecords(request, config, 'ユーザー');
  const matchedUser = userRecords.find((u) => u['氏名'] === targetName);
  expect(matchedUser).toBeTruthy();
  expect(matchedUser?.['ステータス']).toBe('有効');

  // 日報確認・管理画面に戻り、選択した報告者が一覧に表示されたままであることを確認する
  await page.reload();
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  await expect(page.locator('#rm-missing-tbody')).toContainText(targetName);
});
