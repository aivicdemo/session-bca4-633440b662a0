import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-625: 本日の全報告者について、提出済み・未提出の状況が正確に一覧表示される。
//
// panels/scr-1790147095974.html には、報告者ごとの提出状況（提出済み/未提出）を1つのカラムとして左から順に
// 表示する統合された「本日の報告者一覧」は存在しない。実装は「提出済み日報」タブ（#rm-r-tbody、報告者名・
// 報告日・業務内容・提出日時のみで、提出状況を示す専用カラムはない）と「未提出者・リマインダー」タブ
// （#rm-missing-tbody、報告者名・対象日付・最終リマインダー送信日時のみ）に分かれている。文字列として実際に
// 「提出済み」「未提出」という値を持つ提出状況カラムは「検知ログ」タブ（#rm-log-tbody、5列目 提出状況）に
// のみ存在するが、この表はハードコードされた自動検知履歴（3件、日付も本日・前日混在）であり、「本日の報告
// 予定者5人全員」を表すものではない（ui-reference.md にも5人分の一覧表示の実装は確認できない）。詳細は
// unresolved.md を参照。本テストは、この検知ログの提出状況カラムを対象に、仕様の期待結果（5人全員・
// 提出済み/未提出の正確な文言表示）をそのまま検証する。

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

async function fetchTableRecords(request: APIRequestContext, config: AivicConfig, tableName: string): Promise<any[]> {
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

test('本日の全報告者について、提出済み・未提出の状況が正確に一覧表示される', async ({ page, request }) => {
  // テスト環境にログインし、日報確認・管理画面を開く
  await login(page, 'leader_scen625');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const config = await readAivicConfig(page);

  // 本日の日付を確認する
  const detectStatusText = (await page.locator('#rm-detect-status').textContent())?.trim() ?? '';
  const todayMatch = detectStatusText.match(/(\d{4}-\d{2}-\d{2})/);
  expect(todayMatch).not.toBeNull();
  const today = todayMatch ? todayMatch[1] : '';

  // 画面に表示されている報告者一覧（提出状況カラムを持つ検知ログ）を確認する
  await page.getByText('検知ログ', { exact: true }).click();
  const rows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();

  // 社内5人全員が表示されていることを視認する
  const rowCount = await rows.count();
  expect(rowCount).toBe(5);

  // 各報告者の提出状況カラム（提出済み/未提出）を左から順に確認し、その状態を記録する
  const recorded = await rows.evaluateAll((trs) =>
    trs.map((tr) => {
      const cells = tr.querySelectorAll('td');
      return {
        name: cells[0]?.textContent?.trim() ?? '',
        date: cells[1]?.textContent?.trim() ?? '',
        status: cells[4]?.textContent?.trim() ?? '',
      };
    }),
  );
  expect(recorded.length).toBe(rowCount);
  for (const r of recorded) {
    expect(['提出済み', '未提出']).toContain(r.status);
  }

  // 提出済みの報告者について、日報入力・提出画面で実際に提出が完了していることを別途確認する
  const users = await fetchTableRecords(request, config, 'ユーザー');
  const dailyReports = await fetchTableRecords(request, config, '日報');
  const submittedReporters = recorded.filter((r) => r.status === '提出済み' && r.date === today);
  for (const reporter of submittedReporters) {
    const user = users.find((u) => u['氏名'] === reporter.name);
    const hasReport =
      !!user &&
      dailyReports.some(
        (d) => d['ユーザーID'] === user['ユーザーID'] && String(d['報告日'] ?? '').slice(0, 10) === reporter.date,
      );
    expect(hasReport).toBe(true);
  }

  // 未提出の報告者について、画面に『未提出』と表示されていることを確認する
  const nonSubmittedReporters = recorded.filter((r) => r.status === '未提出');
  expect(nonSubmittedReporters.length).toBeGreaterThan(0);
  for (const reporter of nonSubmittedReporters) {
    expect(reporter.status).toBe('未提出');
  }

  // 画面の報告者一覧を再度確認し、提出/未提出の表示が変わっていないことを確認する
  const recordedAgain = await rows.evaluateAll((trs) =>
    trs.map((tr) => tr.querySelectorAll('td')[4]?.textContent?.trim() ?? ''),
  );
  expect(recordedAgain).toEqual(recorded.map((r) => r.status));
});
