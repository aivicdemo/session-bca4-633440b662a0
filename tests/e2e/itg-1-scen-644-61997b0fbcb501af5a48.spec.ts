import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-644: 17時の報告期限を過ぎた時点でリーダーが管理画面を開いたとき、期限までに提出されなかった報告者が未提出者として自動検知される', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/panels/scr-1790147087109.html`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should detect unsubmitted users after deadline (17:00)', async () => {
    // テスト前提：システム時刻を17時01分に設定
    // テスト前提：本日の日報提出期限を17時に設定済み
    // テスト前提：報告者5名のうち3名は既に日報を提出済み、2名は未提出

    const readerEmail = 'leader@company.com';
    const readerPassword = 'password123';

    // リーダーユーザーでシステムにログイン
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');

    await emailInput.fill(readerEmail);
    await passwordInput.fill(readerPassword);
    await loginButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 日報確認・管理画面を開く
    const managementScreenLink = page.locator('a, button').filter({ hasText: /日報確認|管理画面/ }).first();
    await managementScreenLink.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 管理画面の未提出者一覧を確認する
    const unsubmittedList = page.locator('#rm-missing-tbody, [id*="missing"], table tbody').first();
    await expect(unsubmittedList).toBeVisible();

    // 期待結果の検証
    // 1. 未提出者一覧に期限17時を過ぎた時点で提出されていない報告者2名が『未提出者』として表示される
    const unsubmittedRows = page.locator('tbody tr');
    const rowCount = await unsubmittedRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    // 2. 各未提出者の隣には『通知送信済み』の状態が表示される
    const rows = await unsubmittedRows.all();
    let notificationFoundCount = 0;
    for (const row of rows) {
      const rowText = await row.innerText();
      if (rowText.includes('通知送信済み') || rowText.includes('催促')) {
        notificationFoundCount++;
      }
    }
    expect(notificationFoundCount).toBeGreaterThanOrEqual(2);
  });
});
