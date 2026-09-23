import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-619: 報告者ではない役割のユーザーが送信履歴確認画面へのアクセスを試みるとアクセスが拒否される。

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

test('報告者ではない役割のユーザーが送信履歴確認画面へ遷移しようとするとアクセスが拒否される', async ({ page, request }) => {
  const viewerUsername = 'viewer_scen619';

  // 手順1: テストユーザーとして、報告者ではない役割（閲覧のみ権限）のユーザーを準備してログインする。
  await page.goto('/panels/scr-1790147087109.html');
  const config = await readAivicConfig(page);
  await saveTableRecord(request, config, 'ユーザー', {
    'ユーザーID': `usr-${Date.now()}`,
    'ユーザー名': viewerUsername,
    'メールアドレス': `${viewerUsername}@company.jp`,
    '氏名': 'SCEN619検証用ユーザー',
    '部門': '検証部',
    '役割': '閲覧のみ',
    'ステータス': '有効',
    '作成者': 'system',
  });

  await login(page, viewerUsername);

  // 手順2: 日報確認・管理画面にアクセスする。
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const preNavigationUrl = page.url();

  // 手順3: 画面内で送信履歴確認機能（メール送信履歴タブ）へのナビゲーション要素を特定する。
  const mailTab = page.locator('.rm-tab[data-tab="mail"]');

  // 手順4: 送信履歴確認画面への遷移を試みる。
  if (await mailTab.isVisible().catch(() => false)) {
    await mailTab.click();
  } else {
    await page.goto('/panels/scr-1790147095974.html');
  }

  // 期待結果: 遷移がブロックされ、アクセス拒否のエラーメッセージが表示される。送信履歴確認画面のコンテンツは
  // 一切表示されず、ログイン状態を保ったまま遷移前の画面にとどまるか、権限エラー画面にリダイレクトされる。
  await expect(page.getByText(/この機能へのアクセス権限がありません|アクセス権限がありません/)).toBeVisible();
  await expect(page.locator('#rm-mail-tbody tr:not(.rm-empty-row)')).toHaveCount(0);

  const stayedOrBlocked = page.url() === preNavigationUrl || /login\.html/.test(page.url());
  expect(stayedOrBlocked).toBe(true);
});
