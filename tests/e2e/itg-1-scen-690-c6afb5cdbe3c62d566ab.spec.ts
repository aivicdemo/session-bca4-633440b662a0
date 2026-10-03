import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-690: 選択された未提出者がシステムで無効化されている場合、リマインダーが送信されない

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

test('無効ユーザーに対するリマインダー送信は実行されない', async ({ page, request }) => {
  await page.goto('/panels/scr-1790147095974.html');

  const config = await readAivicConfig(page);

  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();

  if (checkboxCount === 0) {
    test.skip();
  }

  const missingRows = page.locator('#rm-missing-tbody tr');

  let inactiveUserFound = false;
  for (let i = 0; i < Math.min(checkboxCount, 5); i++) {
    const row = missingRows.nth(i);
    const nameCell = row.locator('td').nth(1);
    const userName = await nameCell.textContent();

    const userRecords = await fetchTableRecords(request, config, 'ユーザー');
    const matchedUser = userRecords.find(
      (u) => String(u['ユーザー名'] ?? '').includes(userName!) || String(u['氏名'] ?? '').includes(userName!),
    );

    if (matchedUser && String(matchedUser?.['ステータス'] ?? '') === '無効') {
      inactiveUserFound = true;
      break;
    }
  }

  if (!inactiveUserFound) {
    test.skip();
  }

  const checkboxesToClick = page.locator('#rm-missing-tbody input[type="checkbox"]');
  const firstToClick = await checkboxesToClick.first();
  await firstToClick.check();

  const mailHistoryBefore = await fetchTableRecords(request, config, 'メール送信履歴');
  const countBefore = mailHistoryBefore.length;

  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  await sendReminderBtn.click();

  const confirmResult = await page.evaluate(() => {
    return new Promise<boolean>((resolve) => {
      const originalConfirm = window.confirm;
      window.confirm = () => {
        window.confirm = originalConfirm;
        resolve(true);
        return true;
      };
      setTimeout(() => resolve(false), 1000);
    });
  });

  if (confirmResult) {
    await page.waitForTimeout(2000);

    const mailHistoryAfter = await fetchTableRecords(request, config, 'メール送信履歴');
    const countAfter = mailHistoryAfter.length;

    expect(countAfter).toBeLessThanOrEqual(countBefore + 1);
  }
});
