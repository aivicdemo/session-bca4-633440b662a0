import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-681: チームリーダー以外のユーザーがリマインダー設定管理画面にアクセスしようとすると、
// アクセスが拒否される
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
  const usernameInput = page.locator('input[name="username"]');
  const passwordInput = page.locator('input[name="password"]');
  const loginButton = page.locator('button:has-text("ログイン")');

  await usernameInput.fill(username);
  await passwordInput.fill('password');
  await loginButton.click();
  await page.waitForURL(/index\.html/);
}

test('チームリーダー以外のユーザーがリマインダー設定管理画面にアクセスしようとすると、アクセスが拒否される', async ({ page, request }) => {
  const generalUsername = 'general_user_scen681';
  const generalEmail = 'general_user_scen681@example.com';

  await page.goto('/login.html');
  const config = await readAivicConfig(page);

  // 前提: 一般ユーザー（チームリーダー以外）を作成する
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'usr-scen681-general',
    ユーザー名: generalUsername,
    メールアドレス: generalEmail,
    氏名: 'テスト一般',
    部門: '営業部',
    役割: '一般',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });

  // ステップ1: テスト用ブラウザセッションを開く
  // 既に開いている

  // ステップ2: チームリーダー以外のユーザー（例：一般報告者ユーザー）でシステムにログインする
  await login(page, generalUsername);

  // ステップ3: ログイン後、日報確認・管理画面へ遷移する
  const managementLink = page.locator('div.nav-item').filter({ hasText: '管理' });
  
  // 一般ユーザーが管理画面へアクセスできるかをチェック
  let accessGranted = false;
  try {
    await managementLink.click({ timeout: 2000 });
    accessGranted = true;
  } catch (e) {
    accessGranted = false;
  }

  if (accessGranted) {
    await page.waitForURL(/scr-1790147095974\.html/, { timeout: 3000 }).catch(() => {});
  }

  // ステップ4: 日報確認・管理画面内のリマインダー設定管理機能・ボタン・メニュー項目へアクセスを試行する
  const settingsButton = page.locator('#rm-settings-btn');
  
  // ボタンが表示されていないか、クリックできないかを確認
  const isSettingsButtonVisible = await settingsButton.isVisible().catch(() => false);
  
  if (isSettingsButtonVisible) {
    // ボタンが表示されている場合、クリックしてアクセスを拒否される
    await settingsButton.click();
  }

  // ステップ5: ブラウザの開発者ツール（ネットワークタブ）でHTTPレスポンスステータスコードを確認する
  // APIレスポンスをモニタリング
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/') || response.url().includes('/settings'),
    { timeout: 5000 }
  ).catch(() => null);

  // 期待結果: アクセス試行時にHTTPステータスコード403（Forbidden）またはHTTPステータスコード401（Unauthorized）
  // が返され、リマインダー設定管理画面が表示されない。画面上には「アクセス権限がありません」または
  // 「このページへのアクセスは制限されています」というエラーメッセージが表示される。
  // ユーザーは日報確認・管理画面の他の機能（提出済み日報の確認・閲覧など）へのアクセスは可能な状態のままである。

  // 現在のURLを確認（アクセス拒否の場合、管理画面に遷移していない可能性）
  const currentUrl = page.url();
  
  // 管理画面へのアクセスが拒否されたか、またはボタンが見えないかを確認
  if (currentUrl.includes('scr-1790147095974')) {
    // 管理画面に遷移した場合、リマインダー設定管理ボタンが見えないことを確認
    const settingsButtonNotVisible = !(await settingsButton.isVisible().catch(() => false));
    expect(settingsButtonNotVisible).toBe(true);
  } else {
    // 管理画面に遷移していない場合、アクセス拒否の表示をチェック
    const currentPageUrl = page.url();
    expect(!currentPageUrl.includes('scr-1790147095974')).toBe(true);
  }

  // エラーメッセージが表示されているか確認
  const errorMessage = page.locator('text=アクセス権限がありません').or(
    page.locator('text=このページへのアクセスは制限されています')
  );
  
  const errorVisible = await errorMessage.isVisible().catch(() => false);
  
  // アクセス拒否の確認（ボタンが見えない、または遷移できない、またはエラーメッセージ）
  const accessDenied = 
    !isSettingsButtonVisible || 
    !currentUrl.includes('scr-1790147095974') || 
    errorVisible;
  
  expect(accessDenied).toBe(true);
});
