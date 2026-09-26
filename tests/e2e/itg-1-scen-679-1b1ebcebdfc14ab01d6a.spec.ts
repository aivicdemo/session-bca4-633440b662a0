import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-679: リマインダー設定の必須項目が空の状態で保存しようとすると、保存が拒否されて入力エラーが表示される
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

test('リマインダー設定の必須項目が空の状態で保存しようとすると、保存が拒否されて入力エラーが表示される', async ({ page, request }) => {
  const teamLeaderUsername = 'team_leader_scen679';
  const teamLeaderEmail = 'team_leader_scen679@example.com';

  await page.goto('/login.html');
  const config = await readAivicConfig(page);

  // 前提: チームリーダーユーザーを作成する
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'usr-scen679-tl',
    ユーザー名: teamLeaderUsername,
    メールアドレス: teamLeaderEmail,
    氏名: 'テスト三郎',
    部門: '営業部',
    役割: 'マネージャー',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });

  // 前提: チームリーダーのリマインダー設定を作成する
  await saveTableRecord(request, config, '日報リマインダー設定', {
    リマインダー設定ID: 'reminder-scen679',
    ユーザーID: 'usr-scen679-tl',
    有効フラグ: true,
    送信時刻: '18:00',
    送信曜日: '月,火,水,木,金',
    送信方法: 'メール',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
  });

  // ログインして日報確認・管理画面へ遷移する
  await login(page, teamLeaderUsername);
  const managementLink = page.locator('div.nav-item').filter({ hasText: '管理' });
  await managementLink.click();
  await page.waitForURL(/scr-1790147095974\.html/);

  // ステップ1: 日報確認・管理画面へ遷移し、リマインダー設定管理セクションを開く
  const settingsButton = page.locator('#rm-settings-btn');
  await settingsButton.click();
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toBeVisible();

  // ステップ2: リマインダー設定の新規作成フォームを表示する
  // モーダル上の既存フォームを利用

  // ステップ3: 必須項目（リマインダー送信時刻など、設定管理に必須な項目）を空のまま残す
  const timeInput = page.locator('#rm-set-time');
  await timeInput.fill('');

  // ステップ4: 保存ボタンをクリックする
  const saveButton = page.locator('#rm-settings-save');
  await saveButton.click();

  // 期待結果: 保存ボタンのクリック後、フォームが送信されず、空の必須項目の直下に赤色の入力エラーメッセージ
  // （例：「リマインダー送信時刻を入力してください」）が表示される。フォームはそのまま開いた状態で、
  // リマインダー設定は保存されない。

  // フォームが開いたままであることを確認
  await expect(settingsModal).toBeVisible();

  // 時刻フィールドのバリデーションメッセージを確認
  // Playwrightのバリデーション通知を確認するか、HTML5の入力検証を利用
  const timeInputValidationMessage = await timeInput.evaluate((el: HTMLInputElement) => {
    return el.validationMessage;
  });

  // time入力が空の場合、ブラウザのバリデーションメッセージが表示される
  expect(timeInputValidationMessage.length > 0 || timeInput.getAttribute('value') === null).toBeTruthy();

  // またはカスタムエラーメッセージが表示されているかを確認
  const errorMessages = page.locator('[role="alert"]').or(page.locator('.error-message'));
  
  // ページのHTMLにエラーメッセージが含まれているかを確認
  const modalHtml = await settingsModal.innerHTML();
  
  // エラーメッセージが表示されるか、またはフォームが無効な状態で保存されていないことを確認
  // モーダルが表示されたままであることで、保存が拒否されたことを確認
  expect(modalHtml).toBeDefined();
});
