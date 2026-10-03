import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

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
  await page.waitForURL(/panels\/(scr-1790147087109|scr-1790147095974)\.html/);
}

test('SCEN-713: 報告者マスタの新規登録が操作履歴に記録される', async ({ page, request }) => {
  // テスト前提: 報告者マスタ保存機能の操作履歴記録機構がデータベースに接続済みであることを確認する
  await login(page, 'leader_scen713');

  const config = await readAivicConfig(page);
  const recordedAt = new Date();

  // データベースに接続済みであることを確認
  const tables = config.tables.map((t) => t.tableName);
  expect(tables).toContain('ユーザー');

  // テスト対象: 報告者マスタ新規登録時の操作履歴記録を確認するため、管理画面にアクセス
  await page.goto('/panels/scr-1790147095974.html');
  await expect(page.locator('.rm-heading')).toBeVisible();

  // 新しい報告者の登録情報（報告者名、メールアドレスなど必須項目）
  const newReporterName = `新規報告者_${Date.now()}`;
  const newReporterEmail = `reporter_${Date.now()}@example.com`;

  // 保存ボタンをクリックして報告者マスタの新規登録を実行する
  // サンプル画面では報告者マスタ UI が実装されていないため、
  // 仕様の「画面またはDB で確認する」に従い、API 経由で登録を実行

  const registrationResponse = await request.post(`${config.apiUrl}/api/register-reporter`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      app: config.appId,
      reporterName: newReporterName,
      email: newReporterEmail,
    },
  });

  // 操作履歴テーブルに対してクエリを実行し、直前に実行された操作レコードを取得する
  const auditLogs = await fetchTableRecords(request, config, 'ユーザー');

  // 取得したレコードから以下の項目が記録されていることを画面またはDB で確認する
  // 最新レコードを確認
  expect(auditLogs.length).toBeGreaterThan(0);
  const latestRecord = auditLogs[auditLogs.length - 1];

  // 操作種別=「新規登録」
  expect(latestRecord['操作種別']).toBe('新規登録');

  // 対象モジュール=「報告者マスタ」
  expect(latestRecord['対象モジュール']).toBe('報告者マスタ');

  // 実行ユーザー=現在ログイン中のユーザー
  expect(latestRecord['実行ユーザー']).toBe('leader_scen713');

  // 実行日時=現在の日時（秒単位）
  const recordedTime = new Date(latestRecord['実行日時']);
  const timeDiff = Math.abs(recordedTime.getTime() - recordedAt.getTime());
  expect(timeDiff).toBeLessThan(60000);

  // 登録内容の変更差分（新規なので「追加」と記録される）
  expect(latestRecord['変更内容'] || latestRecord['差分']).toContain('追加');
});
