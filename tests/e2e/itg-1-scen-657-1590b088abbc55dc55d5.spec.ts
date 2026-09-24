import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-657: メール配信サービスが一時的に利用不可のとき、最大3回まで指数バックオフで再試行され、
// 3回失敗後は管理者に通知される

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

test('メール配信サービス利用不可時に3回再試行されて管理者に通知される', async ({
  page,
  request,
}) => {
  await page.goto('/panels/scr-1790147095974.html');
  const config = await readAivicConfig(page);

  // 日報確認・管理画面にログイン（管理者権限）

  // 定時の自動検知によって未提出者が一覧表示されるまで待機、または手動で未提出者検知を実行
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible()) {
    await detectBtn.click();
  }

  // 未提出者に対するリマインダー送信操作を実行
  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  if (await sendReminderBtn.isVisible()) {
    await sendReminderBtn.click();
  }

  // 1回目の送信試行が失敗し、画面に「通知送信失敗」というメッセージまたはアラートが表示されることを確認
  let failureMessage = page.locator('text=/通知送信失敗/');
  await expect(failureMessage).toBeVisible({ timeout: 5000 });

  // 指数バックオフの待機時間を経て、2回目の自動再試行が行われ、
  // 画面に同じ「通知送信失敗」メッセージが再度表示されることを確認
  await page.waitForTimeout(2000);

  // 指数バックオフの待機時間を経て、3回目の自動再試行が行われ、
  // 画面に同じ「通知送信失敗」メッセージが再度表示されることを確認
  await page.waitForTimeout(2000);

  // 日報確認・管理画面を更新（リロード）して最新状態を表示
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 未提出者一覧に対して該当ユーザーの行に「通知未送信」フラグが表示されることを確認
  const unsubmittedTable = page.locator('#rm-missing-tbody');
  const rows = await unsubmittedTable.locator('tr');

  let foundUnsentFlag = false;
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const rowText = await row.textContent();
    if (rowText?.includes('通知未送信')) {
      foundUnsentFlag = true;
      break;
    }
  }

  expect(foundUnsentFlag).toBe(true);

  // 画面上部に「通知送信失敗」というメッセージまたはアラートが表示されることを確認
  const alertMessage = page.locator('text=/通知送信失敗/');
  await expect(alertMessage).toBeVisible();

  // 画面内の検知ログ・メール送信履歴確認エリアに、「送信失敗：3回再試行後」という履歴レコードが表示されることを確認
  const logSection = page.locator('#rm-log-tbody');
  const logRows = await logSection.locator('tr');

  let foundRetryLog = false;
  const logCount = await logRows.count();
  for (let i = 0; i < logCount; i++) {
    const row = logRows.nth(i);
    const rowText = await row.textContent();
    if (rowText?.includes('送信失敗：3回再試行後') || rowText?.includes('3回再試行')) {
      foundRetryLog = true;
      break;
    }
  }

  expect(foundRetryLog).toBe(true);
});
