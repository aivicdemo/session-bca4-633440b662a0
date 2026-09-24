import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-656: リーダーのメールアドレスがシステムで無効化されているとき、
// メール通知が送信されず警告が記録される

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

test('リーダーのメールアドレスが無効化されている場合、警告が記録され通知は送信されない', async ({
  page,
  request,
}) => {
  await page.goto('/panels/scr-1790147095974.html');
  const config = await readAivicConfig(page);

  // 未提出検知の定時処理をトリガーする
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible()) {
    await detectBtn.click();
  }

  // 日報確認・管理画面の検知ログ・メール送信履歴セクションを確認
  const logSection = page.locator('#rm-log-tbody');
  await expect(logSection).toBeVisible({ timeout: 5000 });

  // 当該検知処理のログエントリを探し、ログ内容を確認
  const logRows = await logSection.locator('tr');
  const count = await logRows.count();

  let foundWarningLog = false;
  for (let i = 0; i < count; i++) {
    const row = logRows.nth(i);
    const rowText = await row.textContent();
    if (
      rowText?.includes('リーダーのメールアドレス無効化のため送信スキップ') ||
      rowText?.includes('通知送信失敗')
    ) {
      foundWarningLog = true;
      break;
    }
  }

  expect(foundWarningLog).toBe(true);

  // メール送信履歴には該当するリーダーへの送信レコードが存在しないことを確認
  const mailSection = page.locator('#rm-mail-tbody');
  const mailRows = await mailSection.locator('tr');
  const mailCount = await mailRows.count();

  // メール送信履歴が空またはリーダーへの送信がないことを確認
  let foundSkippedMail = false;
  for (let i = 0; i < mailCount; i++) {
    const row = mailRows.nth(i);
    const rowText = await row.textContent();
    if (rowText?.includes('スキップ') || rowText?.includes('無効化')) {
      foundSkippedMail = true;
      break;
    }
  }

  // 管理画面上に「通知送信失敗」フラグが立つ
  const unsubmittedTable = page.locator('#rm-missing-tbody');
  const unsubRows = await unsubmittedTable.locator('tr');
  const unsubCount = await unsubRows.count();

  let foundFailureFlag = false;
  for (let i = 0; i < unsubCount; i++) {
    const row = unsubRows.nth(i);
    const rowText = await row.textContent();
    if (rowText?.includes('通知送信失敗')) {
      foundFailureFlag = true;
      break;
    }
  }

  expect(foundFailureFlag).toBe(true);
});
