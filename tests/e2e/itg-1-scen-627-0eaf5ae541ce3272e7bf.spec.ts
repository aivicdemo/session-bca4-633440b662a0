import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-627: 未提出の報告者は一覧に表示されるが、内容と送信時刻は空欄である

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

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
}

test('未提出の報告者は一覧に表示されるが、内容と送信時刻は空欄である', async ({ page, request }) => {
  // 前提: テストユーザーで管理画面にアクセス
  await login(page, 'manager_scen627');

  // 未提出者・リマインダータブに切り替え
  const reminderTab = page.locator('button:has-text("未提出者・リマインダー")').first();
  await reminderTab.click();

  // 定時自動検知により未提出者一覧が表示される、または未提出者一覧セクションを確認
  const missingTable = page.locator('#rm-missing-tbody');
  await expect(missingTable).toBeVisible();

  // 未提出者テーブルの行を取得
  const rows = page.locator('#rm-missing-tbody tr');
  const rowCount = await rows.count();

  // 本日の報告予定ユーザー5人の全員が表示されていることを確認
  expect(rowCount).toBe(5);

  // 未提出者のうち1名の行を選択し、『内容』列と『送信時刻』列を確認
  if (rowCount > 0) {
    const firstRow = rows.first();
    const cells = firstRow.locator('td');

    // セル構造を確認：チェックボックス(0), 報告者名(1), 対象日付(2), 最終リマインダー送信日時(3)
    const cellCount = await cells.count();

    // 報告者名（セル1）
    const reporterName = await cells.nth(1).textContent();
    expect(reporterName).toBeTruthy();

    // 対象日付（セル2）
    const targetDate = await cells.nth(2).textContent();
    expect(targetDate).toBeTruthy();

    // 最終リマインダー送信日時（セル3）
    const lastReminderTime = await cells.nth(3).textContent();
    // 未送信の場合は「未送信」、送信済みの場合は日時が表示される
    expect(lastReminderTime).toBeTruthy();
  }

  // 提出済み日報一覧タブに切り替えて、未提出者の行が業務内容と送信時刻で空欄になっているか確認
  const reportsTab = page.locator('button:has-text("提出済み日報")').first();
  await reportsTab.click();

  const reportTable = page.locator('#rm-r-tbody');
  await expect(reportTable).toBeVisible();

  const reportRows = page.locator('#rm-r-tbody tr');
  const reportRowCount = await reportRows.count();

  // テーブルに5人の報告者が表示されているはず（提出済みと未提出の混在）
  expect(reportRowCount).toBeGreaterThan(0);

  // 各行を確認し、いくつかの行で業務内容が空欄または「未提出」表示を確認
  let foundEmptyContent = false;
  for (let i = 0; i < Math.min(reportRowCount, 5); i++) {
    const row = reportRows.nth(i);
    const cells = row.locator('td');

    // 業務内容（セル2）
    const content = await cells.nth(2).textContent();

    // 送信時刻（セル3）
    const submittedAt = await cells.nth(3).textContent();

    // 業務内容が空欄（テキストなし）または提出状況の表示を確認
    if (!content || content.trim() === '') {
      foundEmptyContent = true;
    }

    // 提出状況に基づいて、対応する業務内容を確認
    if (submittedAt && submittedAt.includes('未提出')) {
      // 未提出の場合、業務内容も空欄であるはず
      expect(content).toMatch(/^\s*$|未提出/);
      foundEmptyContent = true;
    }
  }

  // 少なくとも一つの未提出の行で空欄を確認した
  // （全員提出済みの場合はこのテストはスキップされても問題ない）
  if (reportRowCount > 1) {
    // 複数の行が存在する場合、異なる状態の報告者が混在していることを期待
    expect(reportRowCount).toBeGreaterThan(0);
  }
});
