import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-678: リマインダー設定の送信時刻・送信曜日・送信方法を変更し、保存すると設定が反映される
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

test('リマインダー設定の送信時刻・送信曜日・送信方法を変更し、保存すると設定が反映される', async ({ page, request }) => {
  const teamLeaderUsername = 'team_leader_scen678';
  const teamLeaderEmail = 'team_leader_scen678@example.com';

  await page.goto('/login.html');
  const config = await readAivicConfig(page);

  // 前提: チームリーダーユーザーを作成する
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'usr-scen678-tl',
    ユーザー名: teamLeaderUsername,
    メールアドレス: teamLeaderEmail,
    氏名: 'テスト次郎',
    部門: '営業部',
    役割: 'マネージャー',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });

  // 前提: チームリーダーのリマインダー設定を作成する（初期値: 9:00, 月～金, メール）
  await saveTableRecord(request, config, '日報リマインダー設定', {
    リマインダー設定ID: 'reminder-scen678',
    ユーザーID: 'usr-scen678-tl',
    有効フラグ: true,
    送信時刻: '09:00',
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

  // ステップ1: リマインダー設定管理セクションを開く
  const settingsButton = page.locator('#rm-settings-btn');
  await settingsButton.click();
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toBeVisible();

  // ステップ2: 現在のリマインダー設定を確認する（送信時刻・送信曜日・送信方法の現在値をメモ）
  const timeInputBefore = page.locator('#rm-set-time');
  const methodSelectBefore = page.locator('#rm-set-method');
  const timeValueBefore = await timeInputBefore.inputValue();
  const methodValueBefore = await methodSelectBefore.inputValue();

  // ステップ3: 送信時刻を変更する（例：9:00 → 10:30）
  await timeInputBefore.fill('10:30');

  // ステップ4: 送信曜日を変更する（例：月〜金 → 月・水・金）
  // 月はチェック済み、火と木をアンチェック、水と金はチェック済み
  const tuesdayCheckbox = page.locator('.rm-day-checkbox[data-day="火"]');
  const thursdayCheckbox = page.locator('.rm-day-checkbox[data-day="木"]');
  
  // 火と木をクリックして外す
  await tuesdayCheckbox.click();
  await thursdayCheckbox.click();

  // ステップ5: 送信方法を変更する（例：メール → メール+ブラウザ通知など、システムが複数方法をサポートする場合）
  const methodSelect = page.locator('#rm-set-method');
  // アプリ通知に変更
  await methodSelect.selectOption('アプリ通知');

  // ステップ6: 「保存」ボタンをクリックする
  const saveButton = page.locator('#rm-settings-save');
  await saveButton.click();

  // ステップ7: 保存完了メッセージが画面に表示されるまで待機する
  const toast = page.locator('#rm-toast');
  await expect(toast).toContainText('設定を保存しました');

  // ステップ8: ページを再読み込みするか、設定管理画面を一度閉じて再度開く
  await page.reload();
  await page.waitForURL(/scr-1790147095974\.html/);

  // ステップ9: リマインダー設定管理セクションで現在の設定値を確認する
  const settingsButtonAfter = page.locator('#rm-settings-btn');
  await settingsButtonAfter.click();
  const settingsModalAfter = page.locator('#rm-settings-modal');
  await expect(settingsModalAfter).toBeVisible();

  // ステップ10: 期待結果の確認
  // ページ再読み込み後、リマインダー設定管理画面に表示される送信時刻が10:30、送信曜日が月・水・金、
  // 送信方法が変更後の値となっており、入力時に指定した3つの項目すべてが反映されていること。
  const timeInputAfter = page.locator('#rm-set-time');
  const methodSelectAfter = page.locator('#rm-set-method');
  const mondayCheckbox = page.locator('.rm-day-checkbox[data-day="月"]');
  const wednesdayCheckbox = page.locator('.rm-day-checkbox[data-day="水"]');
  const fridayCheckbox = page.locator('.rm-day-checkbox[data-day="金"]');
  const tuesdayCheckboxAfter = page.locator('.rm-day-checkbox[data-day="火"]');
  const thursdayCheckboxAfter = page.locator('.rm-day-checkbox[data-day="木"]');

  await expect(timeInputAfter).toHaveValue('10:30');
  await expect(methodSelectAfter).toHaveValue('アプリ通知');
  await expect(mondayCheckbox).toBeChecked();
  await expect(wednesdayCheckbox).toBeChecked();
  await expect(fridayCheckbox).toBeChecked();
  await expect(tuesdayCheckboxAfter).not.toBeChecked();
  await expect(thursdayCheckboxAfter).not.toBeChecked();

  // 保存前後で画面上の表示値が一致すること
  const timeValueAfter = await timeInputAfter.inputValue();
  const methodValueAfter = await methodSelectAfter.inputValue();
  
  expect(timeValueAfter).toBe('10:30');
  expect(methodValueAfter).toBe('アプリ通知');
});
