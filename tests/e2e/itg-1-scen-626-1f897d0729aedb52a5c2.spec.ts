import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-626: 提出済み日報には報告内容と送信時刻が表示される。
//
// panels/scr-1790147095974.html の「提出済み日報」タブ（#rm-r-tbody）は window.AIVIC_PAGE_INIT_JS 内に
// ハードコードされた固定のモック配列（reports）を表示しており、window.AIVIC_API_URL の「日報」テーブルは
// 参照していない（.aivic/batches/1/unresolved.md、.aivic/batches/5/unresolved.md に同種の記録がある）。
// そのため、本テストでテスト用DBへ事前登録した日報レコードは画面の一覧には反映されない可能性が高い。
// また「日報」テーブル（window.AIVIC_TABLES 定義）には「送信時刻」という名称のカラムは存在せず、最も近い
// 項目は「作成日時」である。本テストは、仕様の指示どおりテスト用DB（日報テーブル）へ該当レコードをAPI経由で
// 事前登録した上で、画面の「提出済み日報一覧」にその報告内容・送信時刻が表示されることを、期待結果の文言に
// 忠実に検証する。詳細は unresolved.md を参照。

interface AivicTableDef {
  tableName: string;
}

interface AivicConfig {
  apiUrl: string;
  appId: string;
  systemName: string;
  tables: AivicTableDef[];
}

async function readAivicConfig(page: Page): Promise<AivicConfig> {
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

async function saveTableRecord(
  request: APIRequestContext,
  config: AivicConfig,
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

test('提出済み日報には報告内容と送信時刻が表示される', async ({ page, request }) => {
  const reporterName = 'ユーザーA';
  const reportContent = '本日はシステム保守作業を実施';
  const sentAt = '2024-01-15 14:30:45';
  const reportDate = '2024-01-15';
  const userId = 'usr-scen626-usera';

  await login(page, 'leader_scen626');
  const config = await readAivicConfig(page);

  // テスト用DB上に、提出済み日報レコード（報告者: ユーザーA、報告内容、送信時刻）を事前に登録する
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: userId,
    ユーザー名: 'user_a_scen626',
    メールアドレス: 'user_a_scen626@example.com',
    氏名: reporterName,
    部門: 'テスト部門',
    役割: '一般',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });
  await saveTableRecord(request, config, '日報', {
    日報ID: 'rpt-scen626-001',
    ユーザーID: userId,
    報告日: reportDate,
    業務内容: reportContent,
    作成日時: sentAt.replace(' ', 'T'),
    更新日時: sentAt.replace(' ', 'T'),
  });

  // 日報確認・管理画面へアクセスする
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 画面上の「提出済み日報一覧」セクションを確認する
  await page.getByText('提出済み日報', { exact: true }).click();
  const rows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();

  // 一覧内でユーザーAの日報行を特定し、表示されているセルを目視で確認する
  const targetRow = rows.filter({ hasText: reporterName });
  await expect(targetRow).toHaveCount(1);
  const cells = targetRow.locator('td');

  // 報告内容カラムに「本日はシステム保守作業を実施」と表示されている
  await expect(cells.nth(2)).toHaveText(reportContent);

  // 送信時刻カラムに「2024-01-15 14:30:45」と表示されている
  await expect(cells.nth(3)).toHaveText(sentAt);
});
