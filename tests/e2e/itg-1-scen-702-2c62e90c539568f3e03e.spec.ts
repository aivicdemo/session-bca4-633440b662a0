import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-702: 提出期限の設定が不正な値の場合、催促判定が実行されない
//
// panels/scr-1790147095974.html の「リマインダー設定管理」モーダル（#rm-settings-modal）には
// 有効フラグ（#rm-set-enabled）・送信時刻（#rm-set-time）・送信曜日（.rm-day-checkbox）・
// 送信方法（#rm-set-method）の4項目のみが存在し、「提出期限」に相当する設定項目は存在しない。
// また「定時自動検知による未提出者の催促判定処理をトリガーする」操作に対応するUI要素もない。
// 「検知ログ」タブ（#rm-log-tbody）はハードコードされた固定配列を表示するのみで、「催促判定が
// スキップされた」等のエラーメッセージを記録・表示する仕組みも実装されていない。「未提出者・
// リマインダー」タブの一覧にも「通知未送信」フラグに相当する表示は存在しない。
// 本テストは仕様の文言に忠実に、リマインダー設定管理セクションで「提出期限」欄に不正な値を入力して
// 保存し、検知ログに催促判定スキップを示すメッセージが記録されることを検証する形で記述したが、
// 「提出期限」欄自体が存在しないため、現状のサンプル実装では失敗する可能性が高い。一方、
// 「新たなリマインダーメール送信履歴も追加されていない」という期待結果部分は、メール送信履歴テーブルを
// API経由で参照することで実際に検証可能なため、本テストではその点も併せて確認する。
// 詳細は .aivic/batches/22/unresolved.md を参照。

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
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('提出期限の設定が不正な値の場合、催促判定が実行されない', async ({ page, request }) => {
  // 日報確認・管理画面にログインする
  await login(page, 'admin_scen702');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const config = await readAivicConfig(page);
  const mailCountBefore = (await fetchTableRecords(request, config, 'メール送信履歴')).length;

  // リマインダー設定管理セクションを開く
  const reminderTab = page.locator('.rm-tab[data-tab="reminder"]');
  await reminderTab.click();
  await page.locator('#rm-settings-btn').click();
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toBeVisible();

  // 提出期限の設定値を不正な値（例：空文字列、負の数、または許容範囲外の値）に変更して保存する
  const deadlineField = settingsModal.getByLabel('提出期限');
  await deadlineField.fill('-1');
  await page.locator('#rm-settings-save').click();

  // 設定が保存されたことを確認する
  await expect(settingsModal).toBeHidden();

  // 定時自動検知による未提出者の催促判定処理をトリガーする（またはスケジューラ実行時間まで待機する）
  // → 対応する手動トリガーUIが存在しないため、検知ログタブを開いて現状の記録を確認する。

  // 管理画面の検知ログを確認する
  const logTab = page.locator('.rm-tab[data-tab="log"]');
  await logTab.click();
  await expect(logTab).toHaveClass(/is-active/);
  const logBody = page.locator('#rm-log-tbody');

  // 検知ログに『催促判定がスキップされた』または『期限設定値が不正なため催促判定は実行されませんでした』
  // といったエラーメッセージが記録される
  await expect(logBody).toContainText(/催促判定がスキップされた|期限設定値が不正なため催促判定は実行されませんでした/);

  // 管理画面の未提出者一覧には「通知未送信」フラグが立たない
  await reminderTab.click();
  await expect(page.locator('#rm-missing-tbody')).not.toContainText('通知未送信');

  // 新たなリマインダーメール送信履歴も追加されていない
  const mailCountAfter = (await fetchTableRecords(request, config, 'メール送信履歴')).length;
  expect(mailCountAfter).toBe(mailCountBefore);
});
