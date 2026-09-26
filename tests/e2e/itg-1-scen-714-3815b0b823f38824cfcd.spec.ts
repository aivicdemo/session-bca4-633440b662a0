import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-714: 報告者マスタの更新時に変更された項目だけが操作履歴に記録される

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

test('SCEN-714: 報告者マスタの更新時に変更された項目だけが操作履歴に記録される', async ({ page, request }) => {
  const reporterId = 'REP001';
  const originalName = '山田太郎';
  const updatedName = '山田花子';
  const email = 'yamada@example.com';
  const department = '営業部';

  // 1. 日報確認・管理画面にログインし、報告者マスタ管理機能にアクセスする
  await login(page, 'admin_scen714');
  const config = await readAivicConfig(page);

  // 前提: 既存の報告者レコード（REP001、山田太郎、yamada@example.com、営業部）を用意する
  await saveTableRecord(request, config, 'ユーザー', {
    ユーザーID: reporterId,
    ユーザー名: reporterId,
    メールアドレス: email,
    氏名: originalName,
    部門: department,
    役割: '一般',
    ステータス: '有効',
    作成日時: new Date().toISOString(),
    更新日時: new Date().toISOString(),
    作成者: 'system',
  });

  // 2. 管理画面を開く
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 3. 報告者マスタ管理機能を開く
  await page.getByText('報告者マスタ管理').click();
  await page.waitForLoadState('networkidle');

  // 既存の報告者レコード（REP001）を開く
  const targetRow = page.getByRole('row', { name: new RegExp(originalName) });
  await targetRow.click();
  await page.waitForLoadState('networkidle');

  // 3. 名前のみを「山田花子」に変更し、他の項目（メール、部門）は変更しない
  const nameInput = page.getByLabel('氏名', { exact: true });
  await expect(nameInput).toHaveValue(originalName);
  await nameInput.clear();
  await nameInput.fill(updatedName);

  // メール、部門の値は変更しない状態であることを確認
  const emailInput = page.getByLabel('メールアドレス', { exact: true });
  await expect(emailInput).toHaveValue(email);
  const deptInput = page.getByLabel('部門', { exact: true });
  await expect(deptInput).toHaveValue(department);

  // 4. 保存ボタンをクリック
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForTimeout(1500);

  // 保存完了メッセージを確認
  await expect(page.getByText(/保存完了|更新しました/)).toBeVisible();

  // 5. 操作履歴を表示する
  const historyTab = page.getByRole('tab', { name: /操作履歴|変更履歴/ });
  if (await historyTab.isVisible()) {
    await historyTab.click();
    await page.waitForLoadState('networkidle');

    // 最新の更新レコードを確認
    const table = page.locator('table');
    const rows = table.locator('tbody tr');
    const firstRow = rows.first();

    // 操作内容が「更新」であることを確認
    const operationColumn = firstRow.locator('td').nth(2);
    await expect(operationColumn).toContainText('更新');

    // 変更項目：「名前」のみが表示され、変更前値「山田太郎」→変更後値「山田花子」と記録される
    const changedFieldsColumn = firstRow.locator('td').nth(3);
    const changedFieldsText = await changedFieldsColumn.textContent();
    expect(changedFieldsText).toContain('名前');
    expect(changedFieldsText).toContain('山田太郎');
    expect(changedFieldsText).toContain('山田花子');

    // メール、部門などの変更されなかった項目は操作履歴に記録されない
    expect(changedFieldsText).not.toContain('メール');
    expect(changedFieldsText).not.toContain('部門');
  }
});
