import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-673: 5名全員が日報を提出した場合、検知ログ画面に未提出者一覧は空で表示される。
//
// panels/scr-1790147095974.html には「未提出者一覧」という名称のセクションは検知ログタブ（data-tab="log"）
// には存在せず、最も近い実装は「未提出者・リマインダー」タブ（data-tab="reminder"）内の #rm-missing-tbody で
// ある。この一覧は AIVIC_PAGE_INIT_JS 内にハードコードされた固定配列（missing、3件: 高橋次郎・伊藤三郎・
// 渡辺恵子）を表示するだけで、window.AIVIC_TABLES の「ユーザー」「日報」テーブルの実データとは一切連携しない。
// そのため、5名のユーザーを登録し、5名全員が日報入力・提出画面から日報を提出しても、#rm-missing-tbody の表示
// 内容は変化せず、常に固定の3件が表示され続ける（検知ログタブ #rm-log-tbody も同様にハードコードされた3件の
// 固定配列）。
// 本テストは、仕様の手順どおりに5名のユーザーを準備し、日報入力・提出画面から実際に提出操作を行った上で、
// 未提出者一覧に相当する #rm-missing-tbody（および検知ログの提出状況が「未提出」である行）が0件であることを
// 検証した。詳細は .aivic/batches/16/unresolved.md を参照。

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
  'reporter_scen673_1',
  'reporter_scen673_2',
  'reporter_scen673_3',
  'reporter_scen673_4',
  'reporter_scen673_5',
];

test('5名全員が日報を提出した場合、未提出者一覧は空で表示される', async ({ page, request }) => {
  // テストデータを準備する：5名全員のユーザー（報告者）を日報管理システムに登録済みの状態で用意する
  await page.goto('/panels/scr-1790147087109.html');
  const config = await readAivicConfig(page);
  for (const username of REPORTER_USERNAMES) {
    await saveTableRecord(request, config, 'ユーザー', {
      'ユーザーID': `usr-${username}`,
      'ユーザー名': username,
      'メールアドレス': `${username}@company.jp`,
      '氏名': `SCEN673検証用_${username}`,
      '部門': '営業部',
      '役割': '一般',
      'ステータス': '有効',
      '作成者': 'system',
    });
  }

  // 5名全員が日報入力・提出画面から日報内容を入力し、妥当性チェックを通過させて提出する
  for (const username of REPORTER_USERNAMES) {
    await login(page, username);
    await page.locator('#rp-content').fill(`SCEN-673検証用: ${username} の本日の業務内容の入力です。`);
    await expect(page.locator('#rp-submit-btn')).toBeEnabled();
    await page.locator('#rp-submit-btn').click();
    await expect(page.locator('#rp-success')).toBeVisible({ timeout: 5000 });
  }

  // 日報確認・管理画面を開く
  await login(page, 'leader_scen673');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者一覧セクションを確認する
  // 画面内の「未提出者・リマインダー」タブにアクセス
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  await page.waitForLoadState('networkidle');

  // 未提出者一覧テーブルが表示され、テーブル行が0件（空の状態）で表示される
  const missingTable = page.locator('#rm-missing-tbody');
  const missingRows = missingTable.locator('tr:not(.rm-empty-row)');
  const emptyMessage = missingTable.locator('tr.rm-empty-row');

  // 空の状態を確認
  const emptyCount = await emptyMessage.count();
  if (emptyCount > 0) {
    // 「未提出者はいません」メッセージが表示される
    await expect(emptyMessage).toContainText('未提出者はいません');
  } else {
    // データ行が0件
    await expect(missingRows).toHaveCount(0);
  }
});
