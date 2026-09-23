import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-623: チームリーダーが権限を持つ場合、提出済み日報一覧を正常に表示できる。
//
// 前提「テスト用データベースをリセットし...日報データ（5件以上）が事前投入されていることを確認する」について、
// このサンプルにはテスト用DBをリセットする手段（管理UI・API）が存在しない。また panels/scr-1790147095974.html の
// 「提出済み日報」タブは window.AIVIC_PAGE_INIT_JS 内にハードコードされた固定のモック配列（reports）を表示して
// おり、window.AIVIC_API_URL の「日報」テーブルは参照していない（.aivic/batches/1/unresolved.md に同種の記録が
// ある）。そのため、DB へのデータ投入・リセットは一覧表示に何も影響しない。本テストでは、
// 「日報」テーブルに複数報告者・複数日時の日報が5件以上存在することを API 経由で確認する形で precondition を
// 検証し、以降の検証は画面上に実際に表示される提出済み日報一覧に対して行う。詳細は unresolved.md 参照。

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

test('チームリーダーが権限を持つ場合、提出済み日報一覧を正常に表示できる', async ({ page, request }) => {
  // 複数の報告者によって異なる日時に提出された日報データ（5件以上）がテストDBに事前投入されていることを確認する
  await page.goto('/login.html');
  const config = await readAivicConfig(page);
  const reportRecords = await fetchTableRecords(request, config, '日報');
  expect(reportRecords.length).toBeGreaterThanOrEqual(5);
  const distinctReporters = new Set(reportRecords.map((r) => r['ユーザーID']));
  expect(distinctReporters.size).toBeGreaterThan(1);

  // チームリーダー権限を持つユーザーAでログインする
  await login(page, 'leader_scen623');

  // 日報確認・管理画面へ遷移する
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 提出済み日報一覧表示エリアを確認し、画面上に一覧表示されている日報の件数を数える
  const rows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 一覧に表示された各日報行について、報告者名・提出日時・日報内容のフィールドが正確に描画されていることを確認する
  for (let i = 0; i < rowCount; i++) {
    const cells = rows.nth(i).locator('td');
    await expect(cells.nth(0)).not.toBeEmpty(); // 報告者名
    await expect(cells.nth(1)).not.toBeEmpty(); // 報告日
    await expect(cells.nth(2)).not.toBeEmpty(); // 日報内容（今日何をしたか）
    await expect(cells.nth(3)).not.toBeEmpty(); // 提出日時
  }

  // 一覧の並び順が提出日時の降順（新しい順）で整列されていることを確認する
  const submittedTexts = await rows.evaluateAll((trs) =>
    trs.map((tr) => tr.querySelectorAll('td')[3]?.textContent?.trim() ?? ''),
  );
  expect(submittedTexts.length).toBe(rowCount);
  const submittedTimes = submittedTexts.map((t) => Date.parse(t.replace(' ', 'T')));
  for (const t of submittedTimes) {
    expect(Number.isNaN(t)).toBe(false);
  }
  for (let i = 1; i < submittedTimes.length; i++) {
    expect(submittedTimes[i - 1]).toBeGreaterThanOrEqual(submittedTimes[i]);
  }

  // 任意の提出済み日報行をクリックし、詳細画面への遷移が成立することを確認する
  const firstRow = rows.first();
  const firstRowReporterName = (await firstRow.locator('td').nth(0).textContent())?.trim() ?? '';
  await firstRow.locator('.rm-detail-btn').click();

  const detailModal = page.locator('#rm-view-modal');
  await expect(detailModal).toHaveClass(/is-visible/);
  await expect(page.locator('#rm-view-modal-title')).toContainText(firstRowReporterName);
  await expect(page.locator('#rm-view-modal-body')).not.toBeEmpty();
});
