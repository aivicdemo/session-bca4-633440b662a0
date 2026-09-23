import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-662: 検知ログ画面で、提出期限を過ぎても日報が提出されていない報告者が未提出者として一覧に表示される。
//
// panels/scr-1790147095974.html の「検知ログ」タブ（#rm-log-tbody）は window.AIVIC_PAGE_INIT_JS 内に
// ハードコードされた固定のモック配列（logs、3件）を表示しており、AIVIC_API_URL 経由の「ユーザー」「日報」
// テーブルの内容を一切参照しない（initJs の関数引数 tables はレンダリングに使われていない）。したがって、
// 本テストで登録する「5人中の未提出者」（本セクション末尾参照）は画面にはどのようにデータを準備しても反映
// されない。また、画面上には「定時検知処理を手動トリガーする」ボタンは存在せず、詳細設計
// （daily-report-non-submission-detection.ts#detectNonSubmittedReportersAtDeadline）が定める検知処理の
// 実装（screen_event 呼び出しを含む）も画面には存在しない。さらに page.clock でブラウザのシステム時刻を
// 「提出期限の翌日以降」に変更しても、ログ配列は日時計算を行わない固定文字列であるため表示は変化しない。
// これらの食い違いは .aivic/batches/14/unresolved.md に記録する。本テストは、仕様の手順・期待結果の文言
// （5人の報告者データ準備、システム日時変更、検知トリガー相当の操作、未提出者が報告者名・検知実行日時・
// 未提出フラグ付きで一覧表示される）をそのまま検証する。

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

async function saveTableRecord(
  request: APIRequestContext,
  config: AivicConfig,
  tableName: string,
  record: Record<string, unknown>,
): Promise<void> {
  const tableIndex = config.tables.findIndex((t) => t.tableName === tableName);
  if (tableIndex < 0 || !config.apiUrl) return;
  const query =
    `?app=${encodeURIComponent(config.appId)}` +
    `&system=${encodeURIComponent(config.systemName)}` +
    `&table=${encodeURIComponent(tableName)}`;
  const now = new Date().toISOString();
  await request.post(`${config.apiUrl}/api/${tableIndex}${query}`, {
    data: { ...record, id: `id-${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: now, updatedAt: now },
  });
}

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

const TARGET_DATE = '2026-09-23';
const NEXT_DAY_AFTER_DEADLINE = '2026-09-24T09:00:00+09:00';

test('提出期限を過ぎても提出されていない報告者が未提出者として検知ログに表示される', async ({ page, request }) => {
  // 手順1: テスト環境に管理者ユーザーでログインし、日報確認・管理画面を開く
  await login(page, 'admin_scen662');
  const config = await readAivicConfig(page);

  // 前提: 社内報告者5人のうち、提出期限（本日23:59）までに2人が提出済み、3人が未提出という状態を用意する。
  const submittedNames = ['SCEN662提出済みA', 'SCEN662提出済みB'];
  const nonSubmittedNames = ['SCEN662未提出C', 'SCEN662未提出D', 'SCEN662未提出E'];

  for (const name of [...submittedNames, ...nonSubmittedNames]) {
    await saveTableRecord(request, config, 'ユーザー', {
      'ユーザーID': `usr-${name}`,
      'ユーザー名': name,
      'メールアドレス': `${name}@company.jp`,
      '氏名': name,
      '部門': '営業部',
      '役割': '一般',
      'ステータス': '有効',
      '作成者': 'admin_scen662',
    });
  }
  for (const name of submittedNames) {
    await saveTableRecord(request, config, '日報', {
      '日報ID': `rep-${name}`,
      'ユーザーID': `usr-${name}`,
      '報告日': TARGET_DATE,
      '業務内容': 'SCEN-662検証用: 提出期限内に提出済みの日報',
    });
  }

  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順2: システム日時を「提出期限の翌日以降」に設定する
  await page.clock.setFixedTime(new Date(NEXT_DAY_AFTER_DEADLINE));

  // 手順3: 定時検知処理を手動トリガーまたは自動実行させる
  // 画面上に手動トリガー操作は存在しないため、詳細設計上の screen_event
  // 「scr-1790147095974:未提出者一覧表示」に相当する「未提出者・リマインダー」タブの表示操作を行う。
  await page.getByText('未提出者・リマインダー', { exact: true }).click();

  // 手順4: 日報確認・管理画面の「検知ログ」セクションを表示する
  await page.getByText('検知ログ', { exact: true }).click();
  const rows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();

  // 手順5: 検知ログ一覧から、本日の検知実行レコードを確認する
  const recorded = await rows.evaluateAll((trs) =>
    trs.map((tr) => {
      const cells = tr.querySelectorAll('td');
      return {
        name: cells[0]?.textContent?.trim() ?? '',
        detectedAt: cells[2]?.textContent?.trim() ?? '',
        status: cells[4]?.textContent?.trim() ?? '',
      };
    }),
  );

  // 期待結果: 5人中の未提出者（C・D・E）が未提出者として一覧に表示され、該当レコードには
  // 報告者名・検知実行日時・未提出フラグが記載されている。
  for (const name of nonSubmittedNames) {
    const entry = recorded.find((r) => r.name === name);
    expect(entry).toBeDefined();
    expect(entry?.status).toBe('未提出');
    expect(entry?.detectedAt.length ?? 0).toBeGreaterThan(0);
  }

  // 提出済みの2人（A・B）は未提出者として一覧に表示されない。
  for (const name of submittedNames) {
    expect(recorded.find((r) => r.name === name)).toBeUndefined();
  }
});
