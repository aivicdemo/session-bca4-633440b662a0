import { test, expect, type APIRequestContext, type Browser, type Page } from '@playwright/test';

// SCEN-712: 報告者マスタの変更がリーダーの管理画面の対象者リストに即座に反映される
//
// panels/scr-1790147095974.html には「報告者マスタ管理」機能、および仕様が言及する
// 「対象者リスト」という名称の一覧領域が存在しない（同画面のタブは「提出済み日報」
// 「未提出者・リマインダー」「検知ログ」「メール送信履歴」の4つのみで、報告者マスタの
// 全件を表示する対象者リストというUIはない）。本テストは仕様の文言に忠実な操作・検証を
// そのまま実装した。詳細は .aivic/batches/24/unresolved.md を参照。

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

test('報告者マスタの変更がリーダーの管理画面の対象者リストに即座に反映される', async ({ browser, request }: { browser: Browser; request: APIRequestContext }) => {
  const reporterId = 'reporter_001';

  // 手順1: テスト管理者として日報管理システムにログインし、報告者マスタ管理機能にアクセスする
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, 'admin_scen712');
  const config = await readAivicConfig(adminPage);

  // 手順2: 現在の報告者マスタ一覧を確認し、対象の報告者（reporter_001）の情報を記録する
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: reporterId,
    ユーザー名: reporterId,
    メールアドレス: 'reporter001@example.com',
    氏名: '対象者001',
    部門: '営業部',
    役割: '一般',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });
  await adminPage.getByText('管理', { exact: true }).click();
  await adminPage.waitForURL(/panels\/scr-1790147095974\.html/);
  await adminPage.getByText('報告者マスタ管理').click();

  // 手順3: リーダーユーザーとしてシステムからログアウトし、別セッションで日報確認・管理画面にログインする
  const leaderContext = await browser.newContext();
  const leaderPage = await leaderContext.newPage();
  await login(leaderPage, 'leader_scen712');
  await leaderPage.getByText('管理', { exact: true }).click();
  await leaderPage.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順4: 日報確認・管理画面の「対象者リスト」を表示し、reporter_001が含まれていることを確認する
  await leaderPage.getByText('対象者リスト').click();
  const leaderRow = leaderPage.getByRole('row', { name: new RegExp(reporterId) });
  await expect(leaderRow).toBeVisible();

  // 手順5: テスト管理者セッションに戻り、報告者マスタでreporter_001の所属部門を変更し保存する
  const targetRow = adminPage.getByRole('row', { name: new RegExp(reporterId) });
  await targetRow.click();
  const newDepartment = '企画部';
  await adminPage.getByLabel('所属').fill(newDepartment);
  await adminPage.getByRole('button', { name: '保存' }).click();

  // 手順6-7/期待結果: リーダーセッションをリロードせずに最大10秒間待機し、対象者リストに
  // 変更後の所属部門が反映されていることを確認する。
  await expect(leaderRow).toContainText(newDepartment, { timeout: 10000 });

  await adminContext.close();
  await leaderContext.close();
});
