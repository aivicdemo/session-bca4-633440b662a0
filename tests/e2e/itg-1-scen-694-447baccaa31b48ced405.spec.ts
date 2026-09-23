import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-694: 未提出者が1人選択された場合、リマインダーメールが送信される
//
// panels/scr-1790147095974.html の #rm-send-reminder-btn クリックハンドラは、選択された未提出者の
// lastReminder を更新し mailHistory（ページ内メモリの配列のみ、aivicApi.save 等での永続化は行わない）に
// 履歴を追加した後、showToast() で「リマインダーを送信しました。」というトーストを表示する。仕様が期待する
// 文言「リマインダーメールが送信されました」とは一致しない。この食い違いは
// .aivic/batches/21/unresolved.md に記録する。本テストは仕様の文言どおりに検証を記述する。

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

async function fetchTableRecords(
  request: APIRequestContext,
  config: AivicConfig,
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

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('未提出者が1人選択された場合、リマインダーメールが送信される', async ({ page, request }) => {
  // 手順1: 日報確認・管理画面にログインする
  await login(page, 'leader_scen694');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const config = await readAivicConfig(page);

  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 手順2: 未提出者一覧から、未提出状態のユーザーを1人だけ選択する
  const targetRow = page.locator('#rm-missing-tbody tr', { hasText: '高橋 次郎' });
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-missing-checkbox').check();
  await expect(page.locator('#rm-missing-tbody .rm-missing-checkbox:checked')).toHaveCount(1);

  // 手順3: 「リマインダー送信」ボタンをクリックする
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 手順4: 画面上に「リマインダーメールが送信されました」というメッセージが表示されることを確認する
  await expect(page.getByText('リマインダーメールが送信されました')).toBeVisible({ timeout: 5000 });

  // 期待結果: 未提出者一覧で選択したユーザーの状態が変わる
  await expect(targetRow).not.toContainText('未送信');

  // 期待結果: メール送信がシステムに記録された状態になる
  await expect
    .poll(
      async () => {
        const mails = await fetchTableRecords(request, config, 'メール送信履歴');
        return mails.some(
          (m) => String(m['メールタイプ'] ?? '').includes('リマインダー') && String(m['送信先メールアドレス'] ?? '').includes('高橋'),
        );
      },
      { timeout: 5000, message: '高橋次郎宛のリマインダーメール送信がシステム（メール送信履歴テーブル）に記録されていること' },
    )
    .toBe(true);
});
