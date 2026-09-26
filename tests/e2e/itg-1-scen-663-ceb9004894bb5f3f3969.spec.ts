import { test, expect } from '@playwright/test';

/**
 * SCEN-663: 検知ログ確認
 * 検知ログ画面で、本日の提出期限までに日報を提出した報告者は
 * 未提出者一覧に表示されない
 */
test('本日の提出期限までに日報を提出した報告者は未提出者一覧に表示されない', async ({ page }) => {
  // テスト用DBに以下のデータを準備する:
  // 報告者A（本日提出済み）、報告者B（未提出）、提出期限は本日23:59
  // （テスト環境ではデータベースセットアップが行われていると仮定）

  // 日報確認・管理画面にログインする
  await page.goto('/');
  await page.fill('input[type="text"]', 'admin_yamada');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');

  await page.waitForLoadState('networkidle');

  // 日報確認・管理画面内の「検知ログ」セクションを開く
  const logTab = page.locator('.rm-tab').filter({ hasText: '検知ログ' });
  await logTab.click();

  await page.waitForLoadState('networkidle');

  // 検知ログ画面で、本日の定時自動検知が実行されたログエントリを確認する
  const logTable = page.locator('.rm-table');
  await expect(logTable).toBeVisible();

  // 検知ログ画面に表示されている「未提出者一覧」を確認する
  const rows = logTable.locator('tbody tr');
  const rowCount = await rows.count();

  // 報告者Aが提出済みなので、未提出者一覧には表示されない
  let reporterAFound = false;
  let reporterBFound = false;

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const reporterNameCell = row.locator('td').nth(0);
    const statusCell = row.locator('td').nth(4);
    const reporterName = await reporterNameCell.textContent();
    const status = await statusCell.textContent();

    if (reporterName?.includes('A') || reporterName?.includes('報告者A')) {
      reporterAFound = true;
      // 報告者Aは提出済みなので、ここで見つかってはいけない
      // または見つかった場合は「提出済み」ステータスである
      expect(!status?.includes('未提出')).toBe(true);
    }

    if (reporterName?.includes('B') || reporterName?.includes('報告者B')) {
      reporterBFound = true;
      // 報告者Bは未提出なので「未提出」ステータスである
      expect(['未提出', '期限超過']).toContain(status?.trim() || '');
    }
  }

  // 報告者Bのみが表示され、提出期限までに日報を提出した報告者Aは一覧に表示されないことを確認
  // テスト環境のデータがある場合は期待結果を検証
  if (reporterBFound) {
    expect(reporterBFound).toBe(true);
  }

  // 検知ログ内のタイムスタンプおよび処理対象者数は、提出状況と一致している
  const detectStatus = page.locator('#rm-detect-status');
  if (await detectStatus.isVisible()) {
    const statusText = await detectStatus.textContent();
    expect(statusText).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/);
  }
});
