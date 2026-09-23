import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-710: 既存報告者の情報がマスタで更新される
//
// panels/scr-1790147095974.html には「報告者マスタ管理」機能・編集フォーム・
// 保存完了メッセージのいずれも存在しない（.aivic/batches/24/unresolved.md 参照）。
// 本テストは仕様の文言に忠実な操作・検証をそのまま実装した。既存報告者（山田太郎、
// yamada@example.com）は事前条件として window.AIVIC_API_URL 経由で「ユーザー」テーブル
// （報告者マスタに相当）に用意する。

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
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('既存報告者の情報がマスタで更新される', async ({ page, request }) => {
  const oldEmail = 'yamada@example.com';
  const newEmail = 'yamada.taro@example.com';

  await login(page, 'leader_scen710');
  const config = await readAivicConfig(page);

  // 前提: 既存の報告者1名（山田太郎、メール：yamada@example.com）を用意する。
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: 'usr-scen710',
    ユーザー名: 'yamada_scen710',
    メールアドレス: oldEmail,
    氏名: '山田太郎',
    部門: '営業部',
    役割: '一般',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });

  // 手順1-2: 日報確認・管理画面にログインし、報告者マスタ管理機能にアクセスする
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('報告者マスタ管理').click();

  // 手順3: 既存の報告者1名（山田太郎）の情報を表示する
  const targetRow = page.getByRole('row', { name: /山田太郎/ });
  await expect(targetRow).toBeVisible();
  await targetRow.click();

  // 手順4: 当該報告者のメールアドレスを別の値（yamada.taro@example.com）に変更する
  const emailInput = page.getByLabel('メールアドレス');
  await emailInput.fill(newEmail);

  // 手順5: 当該報告者の情報を保存ボタンで確定する
  await page.getByRole('button', { name: '保存' }).click();

  // 手順6/期待結果: マスタ保存完了のメッセージが画面に表示される
  await expect(page.getByText(/保存(が)?完了|更新されました/)).toBeVisible();

  // 手順7/期待結果: 報告者マスタ一覧画面で、変更した報告者の行に新しいメールアドレスが表示される
  const updatedRow = page.getByRole('row', { name: /山田太郎/ });
  await expect(updatedRow).toContainText(newEmail);
});
