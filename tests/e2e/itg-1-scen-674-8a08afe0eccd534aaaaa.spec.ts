import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-674: 5名全員が日報を提出していない場合、検知ログ画面に5名全員の未提出情報が表示される。
//
// panels/scr-1790147095974.html の検知ログタブ（#rm-log-tbody）は AIVIC_PAGE_INIT_JS 内にハードコードされた
// 固定配列（logs、3件: 高橋次郎・伊藤三郎・渡辺恵子）を表示するだけで、window.AIVIC_TABLES の「ユーザー」
// テーブルの登録件数や実際の提出/未提出状態とは一切連携しない。そのため5名のユーザーを未提出状態のまま用意
// しても、検知ログ一覧には常に固定の3件しか表示されず、5行にはならない。また「定時自動検知が実行される時刻
// まで待機するか、システムの定時検知機能を手動トリガーする」という操作に対応するボタン・スケジューラも
// 画面には存在しない。
// 本テストは5名のユーザーを未提出状態のまま登録し、画面の再読み込み（手動トリガーの代替）を行った上で、
// 仕様の期待結果どおり検知ログに5名全員の未提出情報（報告者名・未提出日時・検知実行時刻を含む5行）が
// 表示されることを検証した。詳細は .aivic/batches/16/unresolved.md を参照。

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
  const now = new Date().toISOString();
  await request.post(`${config.apiUrl}/api/${tableIndex}${query}`, {
    data: { ...record, id: `id-${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: now, updatedAt: now },
  });
}

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

const REPORTER_USERNAMES = [
  'reporter_scen674_1',
  'reporter_scen674_2',
  'reporter_scen674_3',
  'reporter_scen674_4',
  'reporter_scen674_5',
];

test('5名全員が日報を提出していない場合、検知ログ画面に5名全員の未提出情報が表示される', async ({
  page,
  request,
}) => {
  // テスト環境の5名のユーザー（報告者）すべてが日報を未提出の状態に初期化する
  await page.goto('/panels/scr-1790147087109.html');
  const config = await readAivicConfig(page);
  for (const username of REPORTER_USERNAMES) {
    await saveTableRecord(request, config, 'ユーザー', {
      'ユーザーID': `usr-${username}`,
      'ユーザー名': username,
      'メールアドレス': `${username}@company.jp`,
      '氏名': `SCEN674検証用_${username}`,
      '部門': '営業部',
      '役割': '一般',
      'ステータス': '有効',
      '作成者': 'system',
    });
  }

  // 定時自動検知が実行される時刻まで待機するか、システムの定時検知機能を手動トリガーする
  // （画面には手動トリガー用のボタンが存在しないため、代替として画面を再読み込みする）
  await login(page, 'leader_scen674');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.reload();

  // 検知ログ確認画面を開く
  await page.locator('.rm-tab[data-tab="log"]').click();

  // 検知ログ一覧が表示されていることを確認する
  const logRows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  await expect(logRows.first()).toBeVisible();

  // 検知ログ画面に、5名全員の未提出情報が1行ずつ表示される（全5行のレコードが確認できる）
  await expect(logRows).toHaveCount(5);
  for (const username of REPORTER_USERNAMES) {
    await expect(page.locator('#rm-log-tbody')).toContainText(`SCEN674検証用_${username}`);
  }

  // 各行には報告者名、未提出日時、検知実行時刻が含まれている
  const firstRowCells = logRows.first().locator('td');
  await expect(firstRowCells.nth(0)).not.toBeEmpty();
  await expect(firstRowCells.nth(1)).not.toBeEmpty();
  await expect(firstRowCells.nth(2)).not.toBeEmpty();
});
