import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-654: リーダーのメールアドレスが登録されていないとき、メール通知が送信されず
// 「通知送信失敗」フラグが管理画面に表示される。未提出者一覧の該当行にこのフラグが
// 視認でき、管理者が手動対応の必要性を認識できる状態になっている。

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

async function createUserWithoutEmail(
  request: APIRequestContext,
  config: { apiUrl: string; appId: string; systemName: string; tables: AivicTableDef[] },
  record: Record<string, unknown>,
): Promise<void> {
  const tableIndex = config.tables.findIndex((t) => t.tableName === 'ユーザー');
  if (tableIndex < 0 || !config.apiUrl) return;
  const query =
    `?app=${encodeURIComponent(config.appId)}` +
    `&system=${encodeURIComponent(config.systemName)}` +
    `&table=${encodeURIComponent('ユーザー')}`;
  await request.post(`${config.apiUrl}/api/${tableIndex}${query}`, { data: record });
}

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーのメールアドレス未登録時に未提出者一覧へ通知送信失敗フラグが表示される', async ({
  page,
  request,
}) => {
  await login(page, 'admin_scen654');
  const config = await readAivicConfig(page);

  // テスト環境にて、リーダー用ユーザーアカウントを作成し、メールアドレスフィールドを空欄のまま登録する。
  await createUserWithoutEmail(request, config, {
    ユーザー名: 'leader_no_email_scen654',
    メールアドレス: '',
    氏名: 'リーダー未登録メール',
    部門: '営業部',
    役割: 'マネージャー',
    ステータス: '有効',
    作成者: 'admin_scen654',
  });

  // 日報確認・管理画面にアクセスする。
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者検知機能を手動実行する（対応するUI操作が存在しないため、画面再読み込みで代替する）。
  await page.reload();

  // 日報確認・管理画面を更新して、未提出者一覧を表示する。
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 該当するリーダー配下の報告者に対応する行を確認する。
  const missingRows = page.locator('#rm-missing-tbody tr');
  await expect(missingRows.first()).toBeVisible();

  // 未提出者一覧の該当行に『通知送信失敗』フラグが表示される。
  await expect(page.locator('#rm-missing-tbody').getByText('通知送信失敗')).toBeVisible();
});
