import { test, expect } from '@playwright/test';

/**
 * SCEN-661: 検知ログ確認
 * 検知ログ画面を開くと、未提出者の検知詳細情報
 * （検知日時、対象者、検知ステータス、リマインダー送信状況）が表示される
 */
test('検知ログ画面を開くと未提出者の検知詳細情報が表示される', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await page.goto('/');
  await page.fill('input[type="text"]', 'admin_yamada');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');

  // ログイン後、管理画面が表示されるまで待機
  await page.waitForLoadState('networkidle');

  // 画面左側メニューまたはナビゲーションから「検知ログ」項目をクリックする
  const logTab = page.locator('.rm-tab').filter({ hasText: '検知ログ' });
  await logTab.click();

  // 検知ログ画面が表示されるまで待機する
  await page.waitForLoadState('networkidle');

  // 画面に表示される未提出者の検知ログ一覧テーブルを確認する
  const logTable = page.locator('.rm-table');
  await expect(logTable).toBeVisible();

  // テーブルヘッダーに必須列が存在することを確認
  const headers = logTable.locator('thead th');
  const headerTexts = await headers.allTextContents();

  expect(headerTexts).toContain('検知日時');
  expect(headerTexts).toContain('対象者');
  expect(headerTexts).toContain('検知ステータス');
  expect(headerTexts).toContain('リマインダー送信状況');

  // 少なくとも 1 件以上の未提出者検知ログレコードが表示されていることを確認
  const rows = logTable.locator('tbody tr');
  const rowCount = await rows.count();

  expect(rowCount).toBeGreaterThan(0);

  // 最初の行のデータを確認
  const firstRow = rows.first();
  const cells = firstRow.locator('td');

  // 検知日時が時分秒を含む形式で表示されているか確認
  const detectedAtText = await cells.nth(2).textContent();
  expect(detectedAtText).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/);

  // 対象者（社内ユーザー名）が表示されているか確認
  const reporterName = await cells.nth(0).textContent();
  expect(reporterName).toBeTruthy();

  // 検知ステータスが表示されているか確認
  const status = await cells.nth(3).textContent();
  expect(status).toBeTruthy();
  expect(['未提出', '期限超過', '提出済み']).toContain(status?.trim() || '');
});
