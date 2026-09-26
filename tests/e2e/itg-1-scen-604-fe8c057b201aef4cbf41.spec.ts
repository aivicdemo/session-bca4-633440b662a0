import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-604: 無効化されたユーザーアカウントでの日報送信は画面レベルで拒否される。
// (1) 画面アクセス段階で「このアカウントは無効です」が表示される、または
// (2) 送信後にHTTP 403 相当のエラーとなり「送信に失敗しました。管理者に確認してください。」が表示される。
// いずれの場合もメール通知は発生しない（user-authentication-authorization#authenticateAndAuthorizeReporterAccess
// の UserAccountInactiveException、daily-report-submission#validateDailyReportSubmissionEligibility の
// InactiveAccountError に対応）。

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
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('無効なユーザーアカウントでの日報送信は画面レベルで拒否される', async ({ page, request }) => {
  const disabledEmail = 'user_disabled@example.com';

  await page.goto('/login.html');
  const config = await readAivicConfig(page);

  // 前提: ユーザーマスタに無効状態（ステータス=無効）のテストユーザーを登録する。
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'usr-scen604-disabled',
    ユーザー名: 'user_disabled',
    メールアドレス: disabledEmail,
    氏名: '無効テストユーザー',
    部門: 'テスト部門',
    役割: '一般',
    ステータス: '無効',
    disabled: true,
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });

  const mailBefore = await fetchTableRecords(request, config, 'メール送信履歴');

  await login(page, disabledEmail);

  // 画面アクセス時に「このアカウントは無効です」が表示されるか確認
  const accessError = page.locator('text=このアカウントは無効です');
  const accessBlocked = await accessError.isVisible().catch(() => false);

  if (accessBlocked) {
    // (1) 画面アクセス段階でエラーが表示される場合
    await expect(accessError).toBeVisible();
  } else {
    // (2) 画面がロードされた場合、送信後にエラーが表示される
    const textarea = page.locator('#rp-content');
    const submitBtn = page.locator('#rp-submit-btn');
    const successMsg = page.locator('#rp-success');

    await textarea.fill('本日の業務内容');
    await submitBtn.click();

    // HTTP 403 相当のエラーメッセージが表示される
    await expect(page.locator('text=送信に失敗しました。管理者に確認してください。')).toBeVisible();
    // 成功メッセージは表示されない
    await expect(successMsg).not.toBeVisible();
  }

  // メール通知は送信されていない
  const mailAfter = await fetchTableRecords(request, config, 'メール送信履歴');
  expect(mailAfter.length).toBe(mailBefore.length);

  // ユーザーマスタの無効フラグは変更されていない
  const users = await fetchTableRecords(request, config, 'ユーザー');
  const disabledUser = users.find((u) => u['メールアドレス'] === disabledEmail);
  expect(disabledUser?.['ステータス']).toBe('無効');
  expect(disabledUser?.['disabled']).toBe(true);
});
