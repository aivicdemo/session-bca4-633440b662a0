import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-691: 選択された未提出者のメールアドレスが登録されていない場合、送信が中止される。
//
// panels/scr-1790147095974.html の「未提出者・リマインダー」タブ（#rm-missing-tbody）は
// AIVIC_PAGE_INIT_JS 内にハードコードされた固定配列（missing、3件: 高橋次郎・伊藤三郎・渡辺恵子）を
// renderMissing() でそのまま描画するだけであり、各未提出者オブジェクトは id・name・date・lastReminder の
// 4項目のみで、メールアドレスというフィールド自体が存在しない。ユーザーマスタ（window.AIVIC_TABLES の
// 「ユーザー」テーブル）とも一切連携しないため、「メールアドレスが登録されていないユーザー」を画面上で
// 用意する手段が存在しない。また #rm-send-reminder-btn のクリックハンドラは選択された未提出者の
// lastReminder を無条件に現在時刻へ更新し、mailHistory に status「成功」の履歴を追加するのみで、
// メールアドレスの有無を検証する処理や送信を中止する分岐は存在しない。「通知送信失敗」という文言の
// 表示領域、および未提出者一覧に「通知未送信」フラグを表す列も画面のどこにも実装されていない。
// この食い違いは .aivic/batches/19/unresolved.md に記録する。本テストは、ユーザーマスタに
// メールアドレス未登録（空文字）の報告者データを前提として用意した上で、仕様の手順・期待結果の文言を
// そのまま検証する。

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

test('メールアドレスが登録されていない未提出者を選択してリマインダーを送信すると、送信が中止される', async ({
  page,
  request,
}) => {
  // 前提: 未提出者一覧に表示される「高橋 次郎」に対応する報告者データを、メールアドレス未登録（空文字）で
  // ユーザーマスタに用意する。
  await page.goto('/panels/scr-1790147087109.html');
  const config = await readAivicConfig(page);
  await saveTableRecord(request, config, 'ユーザー', {
    'ユーザーID': `usr-${Date.now()}`,
    'ユーザー名': 'jiro_takahashi_scen691',
    'メールアドレス': '',
    '氏名': '高橋 次郎',
    '部門': '営業部',
    '役割': '一般',
    'ステータス': '有効',
    '作成者': 'system',
  });

  // 手順1: 日報確認・管理画面にログインする
  await login(page, 'leader_scen691');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 手順2: 未提出者一覧から、メールアドレスが登録されていないユーザー1名以上を選択する
  const targetRow = page.locator('#rm-missing-tbody tr', { hasText: '高橋 次郎' });
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-missing-checkbox').check();

  // 手順3: リマインダー送信ボタンをクリックする
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 手順4: 管理画面の通知送信結果エリアを確認する
  await expect(page.getByText('通知送信失敗')).toBeVisible();

  // 手順5: 当該未提出者の行を確認する
  await expect(targetRow.getByText('通知未送信')).toBeVisible();
});
