import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-643: リーダーが管理画面にアクセスしたとき、有効なアカウントと管理画面アクセス権限を検証してから
// 未提出者一覧が表示される。
//
// 前提「ユーザーマスタにリーダー権限を持つアカウントを登録し、有効な状態に設定する」「当該リーダーアカウントに
// 『管理画面アクセス権限』を付与する」について、window.AIVIC_TABLES の「ユーザー」テーブルには『管理画面アクセス
// 権限』という専用カラムは存在せず（役割・ステータスのみ）、login.html もどの入力値でもログインできる作りで
// ユーザーマスタとの照合を行わない（フッターに「サンプル実装ではどの入力でもログインできます」と明記）。
// panels/scr-1790147095974.html への遷移時にもアカウント有効性・権限を検証する実装はない（詳細設計の
// authenticateAndAuthorizeLeaderAccess に対応する画面側の呼び出しは存在しない）。本テストでは、役割を
// 「マネージャー」・ステータスを「有効」としたユーザーレコードを登録することで前提条件を最大限模擬しつつ、
// 実際の検証は画面に表示される内容に対して行う。
//
// 期待結果「一覧には未提出者の『氏名』『ユーザーID』『未提出状態』が記載された行が2行以上表示される」について、
// panels/scr-1790147095974.html の「未提出者・リマインダー」タブ（#rm-missing-tbody）の列はチェックボックス・
// 報告者名・対象日付・最終リマインダー送信日時の4列のみで、「ユーザーID」列および「未提出状態」という文言の列は
// 存在しない（ui-reference.md にも該当ヘッダーはない）。またこのタブは初期表示時ではなくタブクリック後に表示される
// （初期表示は「提出済み日報」タブ）。本テストは、実在する列（報告者名）で行の内容を確認し、実在しない
// 「ユーザーID」「未提出状態」列については検証できないことを .aivic/batches/11/unresolved.md に記録する。

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

test('有効なリーダーアカウントで管理画面にアクセスすると、エラーなしで未提出者一覧が表示される', async ({
  page,
  request,
}) => {
  const leaderUsername = 'leader_scen643';

  // 前提: ユーザーマスタにリーダー権限（マネージャー）を持つ有効なアカウントを登録する。
  await page.goto('/panels/scr-1790147087109.html');
  const config = await readAivicConfig(page);
  await saveTableRecord(request, config, 'ユーザー', {
    'ユーザーID': `usr-${Date.now()}`,
    'ユーザー名': leaderUsername,
    'メールアドレス': `${leaderUsername}@company.jp`,
    '氏名': 'SCEN643検証用リーダー',
    '部門': '営業部',
    '役割': 'マネージャー',
    'ステータス': '有効',
    '作成者': 'system',
  });

  // 前提: 報告者5人のアカウントを有効な状態で登録する（画面の未提出者一覧はモックデータのため反映は保証されない）。
  for (let i = 0; i < 5; i++) {
    await saveTableRecord(request, config, 'ユーザー', {
      'ユーザーID': `usr-reporter-scen643-${i}`,
      'ユーザー名': `reporter_scen643_${i}`,
      'メールアドレス': `reporter_scen643_${i}@company.jp`,
      '氏名': `SCEN643検証用報告者${i}`,
      '部門': '営業部',
      '役割': '一般',
      'ステータス': '有効',
      '作成者': 'system',
    });
  }

  // ログイン画面へ遷移し、リーダーアカウントの認証情報でログインする。
  await login(page, leaderUsername);

  // 画面上部メニューから『日報確認・管理画面』へのリンクをクリックする。
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 日報確認・管理画面が正常に読み込まれるまで待機する。
  await expect(page.locator('.rm-heading h1')).toHaveText('日報確認・管理');

  // エラーメッセージ『アクセス権限がありません』『アカウントが無効です』は表示されない。
  await expect(page.getByText('アクセス権限がありません')).toHaveCount(0);
  await expect(page.getByText('アカウントが無効です')).toHaveCount(0);

  // 本日の日報未提出者一覧を確認する（未提出者・リマインダータブ）。
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThanOrEqual(2);

  // 一覧の各行に氏名（報告者名）が記載されていることを確認する。
  for (let i = 0; i < rowCount; i++) {
    const nameCell = rows.nth(i).locator('td').nth(1);
    await expect(nameCell).not.toBeEmpty();
  }
});
