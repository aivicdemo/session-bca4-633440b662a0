import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-677: チームリーダーがリマインダー設定管理画面にアクセスでき、現在の設定内容が表示される
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

async function fetchTableRecords(
  request: APIRequestContext,
  config: { apiUrl: string; appId: string; systemName: string; tables: AivicTableDef[] },
  tableName: string,
): Promise<any[]> {
  const tableIndex = config.tables.findIndex((t) => t.tableName === tableName);
  if (tableIndex < 0 || !config.apiUrl) return [];
  const query =
    `?app=${encodeURIComponent(config.appId)}` +
    `&system=${encodeURIComponent(config.systemName)}` +
    `&table=${encodeURIComponent(tableName)}`;
  const res = await request.get(`${config.apiUrl}/api/${tableIndex}${query}`);
  if (!res.ok()) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? []);
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

test('チームリーダーがリマインダー設定管理画面にアクセスでき、現在の設定内容が表示される', async ({ page, request }) => {
  const teamLeaderUsername = 'team_leader_scen677';
  const teamLeaderEmail = 'team_leader_scen677@example.com';

  await page.goto('/login.html');
  const config = await readAivicConfig(page);

  // 前提: チームリーダーユーザーを作成する
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'usr-scen677-tl',
    ユーザー名: teamLeaderUsername,
    メールアドレス: teamLeaderEmail,
    氏名: 'テスト太郎',
    部門: '営業部',
    役割: 'マネージャー',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });

  // 前提: チームリーダーのリマインダー設定を作成する
  await saveTableRecord(request, config, '日報リマインダー設定', {
    リマインダー設定ID: 'reminder-scen677',
    ユーザーID: 'usr-scen677-tl',
    有効フラグ: true,
    送信時刻: '18:00',
    送信曜日: '月,火,水,木,金',
    送信方法: 'メール',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
  });

  // ステップ1: チームリーダーでログインする
  await login(page, teamLeaderUsername);

  // ステップ2: 日報確認・管理画面へ遷移する
  const managementLink = page.locator('div.nav-item').filter({ hasText: '管理' });
  await managementLink.click();
  await page.waitForURL(/scr-1790147095974\.html/);

  // ステップ3: リマインダー設定管理セクション/ボタンにアクセスする
  const settingsButton = page.locator('#rm-settings-btn');
  await expect(settingsButton).toBeVisible();
  await settingsButton.click();

  // ステップ4: リマインダー設定管理画面が表示されるまで待機する
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toBeVisible();

  // ステップ5: 画面に表示された現在のリマインダー設定内容を確認する
  const enabledCheckbox = page.locator('#rm-set-enabled');
  const timeInput = page.locator('#rm-set-time');
  const methodSelect = page.locator('#rm-set-method');
  const dayCheckboxes = page.locator('.rm-day-checkbox');

  // 期待結果: チームリーダーがリマインダー設定管理画面へ正常にアクセスでき、現在のリマインダー設定内容（送信時刻、送信対象ユーザー一覧、送信タイプなど）が画面に表示される。
  // 画面は正常にレンダリングされ、設定値の入力フィールド・確認表示が操作可能な状態となっている。
  await expect(enabledCheckbox).toBeVisible();
  await expect(timeInput).toBeVisible();
  await expect(methodSelect).toBeVisible();
  await expect(dayCheckboxes).not.toHaveCount(0);

  // 設定値が正しく表示されていることを確認
  await expect(enabledCheckbox).toBeChecked();
  await expect(timeInput).toHaveValue('18:00');
  await expect(methodSelect).toHaveValue('メール');

  // 曜日チェックボックスが正しくチェックされていることを確認
  const mondayCheckbox = page.locator('.rm-day-checkbox[data-day="月"]');
  const tuesdayCheckbox = page.locator('.rm-day-checkbox[data-day="火"]');
  const wednesdayCheckbox = page.locator('.rm-day-checkbox[data-day="水"]');
  const thursdayCheckbox = page.locator('.rm-day-checkbox[data-day="木"]');
  const fridayCheckbox = page.locator('.rm-day-checkbox[data-day="金"]');
  const saturdayCheckbox = page.locator('.rm-day-checkbox[data-day="土"]');
  const sundayCheckbox = page.locator('.rm-day-checkbox[data-day="日"]');

  await expect(mondayCheckbox).toBeChecked();
  await expect(tuesdayCheckbox).toBeChecked();
  await expect(wednesdayCheckbox).toBeChecked();
  await expect(thursdayCheckbox).toBeChecked();
  await expect(fridayCheckbox).toBeChecked();
  await expect(saturdayCheckbox).not.toBeChecked();
  await expect(sundayCheckbox).not.toBeChecked();

  // 保存・キャンセルボタンが操作可能な状態であることを確認
  const saveButton = page.locator('#rm-settings-save');
  const cancelButton = page.locator('#rm-settings-cancel');
  await expect(saveButton).toBeEnabled();
  await expect(cancelButton).toBeEnabled();
});
