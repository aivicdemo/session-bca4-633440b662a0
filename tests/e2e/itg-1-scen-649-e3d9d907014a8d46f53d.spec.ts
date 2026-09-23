import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-649: リーダーのアカウントが無効なとき、管理画面へのアクセスが拒否される。
//
// login.html はどの入力値でもログインできる作りで、ユーザーマスタのステータス（有効・無効）と照合しない
// （フッターに「サンプル実装ではどの入力でもログインできます」と明記）。panels/scr-1790147095974.html への
// 直接アクセスにもアカウント有効性を検証する実装はなく（user-authentication-authorization.ts の
// authenticateAndAuthorizeLeaderAccess・UserAccountInactiveError に対応する画面側の呼び出しは存在しない）、
// HTTP 403 Forbidden や認証エラーページも実装されていない。この食い違いは .aivic/batches/11/unresolved.md に
// 記録する。本テストは、ユーザーマスタにステータス「無効」のリーダーアカウントを登録した上で、仕様の期待結果
// の文言どおり403/Forbidden/認証エラー表示とコンテンツ非表示を検証する。

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

test('アカウントが無効なリーダーは日報確認・管理画面へアクセスできない', async ({ page, request }) => {
  const inactiveLeaderUsername = 'inactive_leader_scen649';

  // テスト環境でリーダーのアカウント（ユーザーマスタで「無効」状態に設定されたアカウント）を用意する。
  await page.goto('/panels/scr-1790147087109.html');
  const config = await readAivicConfig(page);
  await saveTableRecord(request, config, 'ユーザー', {
    'ユーザーID': `usr-${Date.now()}`,
    'ユーザー名': inactiveLeaderUsername,
    'メールアドレス': `${inactiveLeaderUsername}@company.jp`,
    '氏名': 'SCEN649検証用無効リーダー',
    '部門': '営業部',
    '役割': 'マネージャー',
    'ステータス': '無効',
    '作成者': 'system',
  });

  // そのリーダーアカウントで日報確認・管理画面へのアクセスを試みる。
  await login(page, inactiveLeaderUsername);
  await page.goto('/panels/scr-1790147095974.html');

  // ブラウザの応答を確認する: HTTP 403 Forbidden または認証エラーページが表示され、アクセスが拒否される。
  await expect(page.getByText(/403|Forbidden|アカウントが無効です/)).toBeVisible();

  // 画面のコンテンツ（未提出者一覧、リマインダー設定、検知ログなど）は表示されない。
  await expect(page.locator('#rm-missing-tbody')).toHaveCount(0);
  await expect(page.locator('#rm-settings-btn')).toHaveCount(0);
  await expect(page.locator('#rm-log-tbody')).toHaveCount(0);
});
