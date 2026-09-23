import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-695: 未提出者が複数選択された場合、全員にリマインダーメールが送信される
//
// panels/scr-1790147095974.html の #rm-send-reminder-btn クリックハンドラは同期的に処理され、送信処理中を
// 示す独立したメッセージ（スピナー等）は表示されず、完了時に showToast() で「リマインダーを送信しました。」
// というトーストのみが表示される。仕様が期待する「リマインダーメール送信処理が実行されたことを示すメッセージ」
// および「リマインダーメール送信完了」という文言とは一致しない。この食い違いは
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

test('未提出者が複数選択された場合、全員にリマインダーメールが送信される', async ({ page, request }) => {
  // 手順1: 日報確認・管理画面にアクセスし、管理者権限で画面を開く
  await login(page, 'admin_scen695');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const config = await readAivicConfig(page);

  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 手順2: 定時検知により未提出者一覧が表示されたことを確認する
  await expect(page.locator('#rm-detect-status')).not.toBeEmpty();
  await expect(page.locator('#rm-missing-tbody tr')).not.toHaveCount(0);

  // 手順3: 未提出者一覧から、未提出者2名以上を複数選択する
  const rowNames = ['高橋 次郎', '伊藤 三郎'];
  for (const name of rowNames) {
    const row = page.locator('#rm-missing-tbody tr', { hasText: name });
    await expect(row).toBeVisible();
    await row.locator('.rm-missing-checkbox').check();
  }
  await expect(page.locator('#rm-missing-tbody .rm-missing-checkbox:checked')).toHaveCount(rowNames.length);

  // 手順4: 「リマインダー送信」ボタンをクリックする
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 手順5: 画面上にリマインダーメール送信処理が実行されたことを示すメッセージが表示されることを待つ
  await expect(page.getByText(/リマインダー.*送信.*(処理|中)/)).toBeVisible({ timeout: 5000 });

  // 手順6: 送信完了後、画面上に「リマインダーメール送信完了」のメッセージが表示されることを確認する
  await expect(page.getByText('リマインダーメール送信完了')).toBeVisible({ timeout: 5000 });

  // 期待結果: 複数選択された全ての未提出者に対してリマインダーメール送信が実行される
  for (const name of rowNames) {
    const row = page.locator('#rm-missing-tbody tr', { hasText: name });
    await expect(row).not.toContainText('未送信');
  }

  // 期待結果: 選択人数分のメール送信が確認できる
  await expect
    .poll(
      async () => {
        const mails = await fetchTableRecords(request, config, 'メール送信履歴');
        return rowNames.every((name) =>
          mails.some(
            (m) =>
              String(m['メールタイプ'] ?? '').includes('リマインダー') &&
              String(m['送信先メールアドレス'] ?? '').includes(name),
          ),
        );
      },
      { timeout: 5000, message: '選択した全員分のリマインダーメール送信がシステムに記録されていること' },
    )
    .toBe(true);
});
