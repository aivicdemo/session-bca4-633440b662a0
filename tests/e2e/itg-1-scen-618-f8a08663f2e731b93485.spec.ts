import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-618: アカウントが無効な報告者が送信履歴確認画面へのアクセスを試みるとアクセスが拒否される。

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

test('無効化されたアカウントの報告者が送信履歴確認画面へアクセスするとアクセスが拒否される', async ({ page, request }) => {
  const disabledUsername = 'reporter_scen618_disabled';

  // 手順1: テスト用ユーザーマスタにて、報告者アカウントを『無効』状態に設定する。
  await page.goto('/panels/scr-1790147087109.html');
  const config = await readAivicConfig(page);
  await saveTableRecord(request, config, 'ユーザー', {
    'ユーザーID': `usr-${Date.now()}`,
    'ユーザー名': disabledUsername,
    'メールアドレス': `${disabledUsername}@company.jp`,
    '氏名': 'SCEN618検証用ユーザー',
    '部門': '検証部',
    '役割': '一般',
    'ステータス': '無効',
    '作成者': 'system',
  });

  // 手順2・3: ログイン画面にアクセスし、無効状態の報告者アカウントの認証情報でログインする。
  await page.goto('/login.html');
  await page.getByTestId('username').fill(disabledUsername);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForLoadState('networkidle');

  // 手順4: ログイン処理が完了した後、送信履歴確認画面（日報確認・管理画面の送信履歴タブ）のURLを直接入力してアクセスを試みる。
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  const mailTab = page.locator('.rm-tab[data-tab="mail"]');
  if (await mailTab.isVisible().catch(() => false)) {
    await mailTab.click();
  }

  // 手順5: 画面の遷移・コンテンツ表示状態を確認する。
  // 期待結果: (1) ログイン画面へリダイレクトされる、または (2) アカウント無効・権限エラーのメッセージが表示され、
  // 送信履歴データは表示されない。
  const redirectedToLogin = /login\.html/.test(page.url());
  if (redirectedToLogin) {
    await expect(page).toHaveURL(/login\.html/);
  } else {
    await expect(page.getByText(/このアカウントはアクティブではありません|アクセス権限がありません/)).toBeVisible();
    await expect(page.locator('#rm-mail-tbody tr:not(.rm-empty-row)')).toHaveCount(0);
  }
});
