import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-690: 選択された未提出者がシステムで無効化されている場合、リマインダーが送信されない。
//
// panels/scr-1790147095974.html の未提出者一覧（missing 配列）はハードコードされたモック値（高橋次郎・伊藤三郎・
// 渡辺恵子）で、window.AIVIC_PRESET_SEED のユーザーテーブルの氏名とは一致しない。そのため「ユーザーマスタで既に
// 無効化されているユーザー」を未提出者一覧から選択するという前提操作を画面上で再現できない。また
// 「選択した未提出者にリマインダーを送信」ボタンの処理には、ユーザーの有効/無効ステータスによる送信可否の分岐が
// 実装されておらず、常に mailHistory へステータス「成功」のレコードを追加する。本テストは仕様の期待結果の文言
// どおりに検証を記述したが、上記の理由により現状のサンプル実装では成立しない可能性が高い。詳細は
// .aivic/batches/19/unresolved.md を参照。

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

test('ユーザーマスタで無効化されているユーザーへはリマインダーが送信されない', async ({ page, request }) => {
  // 日報確認・管理画面にログインし、管理者権限で画面を開く
  await login(page, 'admin_scen690');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者一覧を表示するため、定時自動検知による未提出者リストを確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);

  // ユーザーマスタで既に無効化されているユーザー（例：退職者など）の氏名を確認する
  const config = await readAivicConfig(page);
  const userRecords = await fetchTableRecords(request, config, 'ユーザー');
  const inactiveUser = userRecords.find((u) => u['ステータス'] === '無効' || u['ステータス'] === '休止');
  expect(inactiveUser).toBeTruthy();
  const inactiveName = String(inactiveUser?.['氏名'] ?? '');

  // 未提出者リスト内から、無効化されているユーザーを1名以上選択する
  const targetRow = page.locator('#rm-missing-tbody tr', { hasText: inactiveName });
  await expect(targetRow).toHaveCount(1);
  await targetRow.locator('.rm-missing-checkbox').check();

  const mailRecordsBefore = await fetchTableRecords(request, config, 'メール送信履歴');
  const mailCountBefore = mailRecordsBefore.filter((m) => String(m['本文'] ?? '').includes(inactiveName)).length;

  // 選択したユーザーに対して「リマインダー送信」ボタンを実行する
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 管理画面の画面表示を確認する
  // 無効化されたユーザーに対するリマインダーメール送信は実行されない。
  // 管理画面に送信完了または送信失敗の表示は現れない。
  await expect(page.locator('#rm-toast')).not.toContainText('リマインダーを送信しました');

  // 管理画面のメール送信履歴ログを確認する
  // メール送信履歴ログにはそのユーザーへの送信記録が残らない
  await page.getByText('メール送信履歴', { exact: true }).click();
  await expect(page.locator('#rm-mail-tbody')).not.toContainText(inactiveName);

  const mailRecordsAfter = await fetchTableRecords(request, config, 'メール送信履歴');
  const mailCountAfter = mailRecordsAfter.filter((m) => String(m['本文'] ?? '').includes(inactiveName)).length;
  expect(mailCountAfter).toBe(mailCountBefore);
});
