import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-670: チームメンバーが登録されていない場合、検知ログ画面に
// 「チームに報告者が登録されていません」警告メッセージが表示される。
//
// panels/scr-1790147095974.html の「検知ログ」タブ（#rm-log-tbody）はハードコードされた固定配列（logs）を
// 表示するのみで、window.AIVIC_TABLES の「ユーザー」テーブル（ユーザーマスタ）の登録状況を一切参照しない。
// そのためユーザーマスタを空にしても、検知ログ一覧の表示内容は変化しない。また「チームに報告者が登録されて
// いません」という警告メッセージ、画面上部への警告表示、黄色/オレンジ系の警告背景色に相当する実装は画面の
// どこにも存在しない（ui-reference.md の visibleTexts にも該当文言は含まれていない）。詳細設計上、近い概念
// としては daily-report-non-submission-detection.ts の identifyReportersEligibleForSubmissionCheck の
// NoEligibleReportersError「提出対象の報告者が存在しません。」があるが、文言が仕様と一致しない。
// 本テストは「チームメンバー登録を空の状態に設定する」前提を、ユーザーマスタの全レコードを API 経由で削除する
// ことで再現した上で、仕様の期待結果の文言どおりに検証を記述した。詳細は .aivic/batches/16/unresolved.md を参照。

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

function buildQuery(config: AivicConfig, tableName: string): string {
  return (
    `?app=${encodeURIComponent(config.appId)}` +
    `&system=${encodeURIComponent(config.systemName)}` +
    `&table=${encodeURIComponent(tableName)}`
  );
}

async function deleteAllRecords(
  request: APIRequestContext,
  config: AivicConfig,
  tableName: string,
): Promise<void> {
  const tableIndex = config.tables.findIndex((t) => t.tableName === tableName);
  if (tableIndex < 0 || !config.apiUrl) return;
  const query = buildQuery(config, tableName);
  const res = await request.get(`${config.apiUrl}/api/${tableIndex}${query}`);
  const data = await res.json().catch(() => []);
  const items: Array<Record<string, unknown>> = Array.isArray(data) ? data : data.items ?? [];
  for (const item of items) {
    const id = item.id as string | undefined;
    if (!id) continue;
    await request.delete(`${config.apiUrl}/api/${tableIndex}/${id}${query}`);
  }
}

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('チームメンバーが登録されていない場合、検知ログ画面に警告メッセージが表示される', async ({ page, request }) => {
  // テスト環境の日報確認・管理画面にアクセスし、ログイン状態を確認する
  await login(page, 'leader_scen670');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const config = await readAivicConfig(page);

  // ユーザーマスタでチームメンバー登録を空の状態に設定する（登録を削除する）
  await deleteAllRecords(request, config, 'ユーザー');

  // 日報確認・管理画面の左メニューから「検知ログ」を選択する
  await page.reload();
  await page.locator('.rm-tab[data-tab="log"]').click();

  // 検知ログ画面が表示されるまで待機する
  await expect(page.locator('#rm-log-tbody')).toBeVisible();

  // 検知ログ画面上部に警告メッセージ「チームに報告者が登録されていません」が表示される
  const warning = page.getByText('チームに報告者が登録されていません');
  await expect(warning).toBeVisible();

  // メッセージの表示位置は画面上部で、背景色は警告を示す色（黄色またはオレンジ）であること
  const box = await warning.boundingBox();
  const panelBox = await page.locator('[data-panel="log"]').boundingBox();
  expect(box).not.toBeNull();
  expect(panelBox).not.toBeNull();
  if (box && panelBox) {
    expect(box.y).toBeLessThanOrEqual(panelBox.y + panelBox.height / 2);
  }
  const bg = await warning.evaluate((el) => getComputedStyle(el).backgroundColor);
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  expect(match).not.toBeNull();
  if (match) {
    const [, r, g, b] = match.map(Number) as unknown as [number, number, number, number];
    expect(r).toBeGreaterThan(150);
    expect(g).toBeGreaterThan(100);
    expect(b).toBeLessThan(150);
  }
});
