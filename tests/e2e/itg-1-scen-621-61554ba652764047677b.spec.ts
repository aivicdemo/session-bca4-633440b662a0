import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-621: ユーザーの役割情報がデータベースに存在しない場合、ユーザー情報が見つからないという例外が発生する。

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

test('役割情報が存在しないユーザーのメール送信履歴を表示しようとすると、ユーザー情報が見つからないエラーになる', async ({
  page,
  request,
}) => {
  const roleLessUsername = 'roleless_scen621';

  // 手順1: ユーザーマスタにユーザーIDは存在するが、役割情報が欠落している状態を準備する
  // （役割列を空のまま登録することで、役割情報が存在しない状態を模擬する）。
  await page.goto('/panels/scr-1790147087109.html');
  const config = await readAivicConfig(page);
  await saveTableRecord(request, config, 'ユーザー', {
    'ユーザーID': `usr-${Date.now()}`,
    'ユーザー名': roleLessUsername,
    'メールアドレス': `${roleLessUsername}@company.jp`,
    '氏名': 'SCEN621検証用ユーザー',
    '部門': '検証部',
    '役割': '',
    'ステータス': '有効',
    '作成者': 'system',
  });

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // 手順2: 日報確認・管理画面にアクセスし、ログイン済みの状態を確認する。
  await login(page, roleLessUsername);
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順3: メール送信履歴の確認機能を選択する。
  // 手順4: 役割情報が欠落しているユーザーによる過去の日報送信に対応するメール送信履歴を検索・表示しようとする。
  await page.locator('.rm-tab[data-tab="mail"]').click();

  // 手順5: 画面が『ユーザー情報が見つかりません』というエラーメッセージを表示することを確認する。
  await expect(page.getByText('ユーザー情報が見つかりません')).toBeVisible();

  // 期待結果: 管理画面は操作不可状態となり、エラー内容がコンソールに例外ログとして記録される。
  await expect(page.locator('.rm-tab, .rm-primary-btn, .rm-secondary-btn').first()).toBeDisabled();
  expect(consoleErrors.length).toBeGreaterThan(0);
});
