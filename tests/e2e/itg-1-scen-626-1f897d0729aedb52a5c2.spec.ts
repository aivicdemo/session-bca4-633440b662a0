import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-626: 提出済み日報には報告内容と送信時刻が表示される

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

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
}

test('提出済み日報には報告内容と送信時刻が表示される', async ({ page, request }) => {
  // 前提: テスト用DBに提出済み日報レコード（ユーザーA、報告内容: "本日はシステム保守作業を実施"）を事前登録
  // ここでは、ログイン後に画面で確認することを検証

  await login(page, 'manager_scen626');

  // 日報確認・管理画面が開いていることを確認
  const reportTable = page.locator('#rm-r-tbody');
  await expect(reportTable).toBeVisible();

  // テーブル行を取得
  const rows = page.locator('#rm-r-tbody tr');
  await expect(rows.first()).toBeVisible();

  // テーブルから「本日はシステム保守作業を実施」という内容を含む行を探す
  const targetContent = '本日はシステム保守作業を実施';
  let foundRow = null;
  let foundRowIndex = -1;

  const rowCount = await rows.count();
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const rowText = await row.textContent();
    if (rowText && rowText.includes(targetContent)) {
      foundRow = row;
      foundRowIndex = i;
      break;
    }
  }

  // ユーザーAの日報行が特定できたことを確認
  expect(foundRow).toBeTruthy();

  // 行のセルを確認
  const cells = foundRow!.locator('td');
  const cellCount = await cells.count();

  // テーブルのセル内容を確認
  // 報告者名（セル0）
  const reporterName = await cells.nth(0).textContent();
  expect(reporterName).toBeTruthy();

  // 報告日（セル1）
  const reportDate = await cells.nth(1).textContent();
  expect(reportDate).toBeTruthy();

  // 業務内容（セル2）- 「本日はシステム保守作業を実施」が含まれる
  const reportContent = await cells.nth(2).textContent();
  expect(reportContent).toContain(targetContent);

  // 提出日時（セル3）- 「2024-01-15 14:30:45」形式の時刻が表示されている
  const submittedAt = await cells.nth(3).textContent();
  expect(submittedAt).toBeTruthy();
  // 時刻形式の簡易チェック（YYYY-MM-DD HH:MM:SS または類似形式）
  expect(submittedAt).toMatch(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/);

  // 詳細ボタンをクリックして、モーダルで詳細情報を確認
  if (cellCount > 4) {
    const detailButton = cells.nth(4).locator('button').first();
    if (await detailButton.isVisible()) {
      await detailButton.click();

      // モーダルが開いたことを確認
      const modal = page.locator('#rm-view-modal');
      await expect(modal).toHaveClass(/is-visible/);

      // モーダル内に報告内容が表示されている
      const modalBody = page.locator('#rm-view-modal-body');
      const modalText = await modalBody.textContent();
      expect(modalText).toContain(targetContent);

      // モーダルを閉じる
      const closeBtn = page.locator('#rm-view-modal-close');
      await closeBtn.click();
      await expect(modal).not.toHaveClass(/is-visible/);
    }
  }
});
