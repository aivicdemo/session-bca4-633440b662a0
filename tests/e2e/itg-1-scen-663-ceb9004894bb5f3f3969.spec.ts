import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-663: 検知ログ画面で、本日の提出期限までに日報を提出した報告者は未提出者一覧に表示されない。
//
// panels/scr-1790147095974.html の「検知ログ」タブ（#rm-log-tbody）は window.AIVIC_PAGE_INIT_JS 内に
// ハードコードされた固定のモック配列（logs、3件、報告者名は高橋次郎・伊藤三郎・渡辺恵子に固定）であり、
// AIVIC_API_URL 経由の「ユーザー」「日報」テーブルを参照しない（initJs の関数引数 tables はレンダリングに
// 使われていない）。したがって、本テストで登録する報告者A（提出済み）・報告者B（未提出）のテストデータは
// 画面の検知ログには一切反映されない。この食い違いは .aivic/batches/14/unresolved.md に記録する。
// 本テストは、仕様の手順・期待結果の文言（検知ログの「未提出者一覧」＝提出状況が「未提出」の行に、
// 報告者Bのみが含まれ、報告者Aは含まれないこと）をそのまま検証する。

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

const TARGET_DATE = '2026-09-23';
const BEFORE_DEADLINE_DATETIME = `${TARGET_DATE}T23:59:00+09:00`;

test('提出期限までに提出した報告者は検知ログの未提出者一覧に表示されない', async ({ page, request }) => {
  // 手順1: テスト用DBに以下のデータを準備する: 報告者A（本日提出済み）、報告者B（未提出）、提出期限は本日23:59
  await login(page, 'leader_scen663');
  const config = await readAivicConfig(page);

  const reporterA = 'SCEN663報告者A';
  const reporterB = 'SCEN663報告者B';

  await saveTableRecord(request, config, 'ユーザー', {
    'ユーザーID': `usr-${reporterA}`,
    'ユーザー名': reporterA,
    'メールアドレス': `${reporterA}@company.jp`,
    '氏名': reporterA,
    '部門': '営業部',
    '役割': '一般',
    'ステータス': '有効',
    '作成者': 'leader_scen663',
  });
  await saveTableRecord(request, config, 'ユーザー', {
    'ユーザーID': `usr-${reporterB}`,
    'ユーザー名': reporterB,
    'メールアドレス': `${reporterB}@company.jp`,
    '氏名': reporterB,
    '部門': '営業部',
    '役割': '一般',
    'ステータス': '有効',
    '作成者': 'leader_scen663',
  });
  await saveTableRecord(request, config, '日報', {
    '日報ID': `rep-${reporterA}`,
    'ユーザーID': `usr-${reporterA}`,
    '報告日': TARGET_DATE,
    '業務内容': 'SCEN-663検証用: 提出期限内に提出済みの日報',
  });
  // 報告者Bは日報を提出しない。

  // 手順2: 日報確認・管理画面にログインする（画面を開く）
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.clock.setFixedTime(new Date(BEFORE_DEADLINE_DATETIME));

  // 手順3: 日報確認・管理画面内の「検知ログ」セクションを開く
  await page.getByText('検知ログ', { exact: true }).click();
  const rows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();

  // 手順4・5: 本日の定時自動検知が実行されたログエントリと、そこに表示されている「未提出者一覧」を確認する
  const recorded = await rows.evaluateAll((trs) =>
    trs.map((tr) => {
      const cells = tr.querySelectorAll('td');
      return {
        name: cells[0]?.textContent?.trim() ?? '',
        detectedAt: cells[2]?.textContent?.trim() ?? '',
        status: cells[4]?.textContent?.trim() ?? '',
      };
    }),
  );
  const nonSubmittedEntries = recorded.filter((r) => r.status === '未提出');

  // 期待結果: 未提出者一覧には報告者Bのみが表示され、報告者Aは表示されない。
  const entryB = nonSubmittedEntries.find((r) => r.name === reporterB);
  expect(entryB).toBeDefined();
  expect(recorded.find((r) => r.name === reporterA)).toBeUndefined();

  // 検知ログ内のタイムスタンプおよび処理対象者数は、提出状況と一致している。
  for (const entry of nonSubmittedEntries) {
    expect(entry.detectedAt.length).toBeGreaterThan(0);
  }
  expect(nonSubmittedEntries.length).toBeGreaterThan(0);
});
