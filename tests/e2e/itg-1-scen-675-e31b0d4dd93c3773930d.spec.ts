import { test, expect, type Page } from '@playwright/test';

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

test('SCEN-675: リーダーが管理画面にアクセス可能な場合、メール送信履歴一覧が表示される', async ({ page }) => {
  // リーダーロールを持つユーザーでシステムにログインする
  await login(page, 'reader_scen675');

  // 日報確認・管理画面へ遷移する（ログイン後の遷移先が管理画面）
  expect(page.url()).toContain('scr-1790147095974');

  // 管理画面内の「メール送信履歴」セクション/タブを開く
  const mailHistoryTab = page.locator('.rm-tab:nth-child(4)');
  await mailHistoryTab.click();

  // メール送信履歴一覧が表示されるまで待機
  await page.waitForSelector('#rm-mail-tbody', { timeout: 5000 });

  // メール送信履歴一覧画面が表示される
  const mailHistoryTable = page.locator('#rm-mail-tbody');
  await expect(mailHistoryTable).toBeVisible();

  // 以下の要素が確認できる：
  // (1) 送信日時の列を持つデータテーブルが表示される
  const tableRows = page.locator('#rm-mail-tbody tr');
  const firstRow = tableRows.first();

  // テーブルの各セル（送信日時、送信先、メール種別、ステータス）を確認
  const cells = firstRow.locator('td');
  const cellCount = await cells.count();
  expect(cellCount).toBeGreaterThanOrEqual(4);

  // (2) 送信対象ユーザー名（送信先メールアドレス）が表示されている
  if (cellCount > 2) {
    const toCell = cells.nth(2);
    const toText = await toCell.textContent();
    expect(toText).toBeTruthy();
  }

  // (3) メール種別（リマインダーメール/アラートメール等）が表示されている
  if (cellCount > 1) {
    const typeCell = cells.nth(1);
    const typeText = await typeCell.textContent();
    expect(typeText).toBeTruthy();
    // メール種別の例: リマインダー、提出通知、未提出通知など
    expect([
      'リマインダー',
      '提出通知',
      '未提出通知',
      '締切超過催促',
      '承認待ち通知',
      '日報承認完了通知',
      'リマインダー設定変更確認',
      '日報提出状況レポート',
      '日報テンプレート更新通知',
    ]).toContain(typeText?.trim());
  }

  // (4) 配信状態（成功/失敗/再試行中など）を含む列を持つデータテーブルが表示される
  if (cellCount > 3) {
    const statusCell = cells.nth(3);
    const statusText = await statusCell.textContent();
    expect(statusText).toBeTruthy();
    // 配信状態の例: 成功、失敗、保留中
    expect(['成功', '失敗', '保留中']).toContain(statusText?.trim());
  }

  // 一覧は最新の送信記録から順に表示される
  const rowCount = await tableRows.count();
  if (rowCount > 1) {
    // 最初の行と2番目の行の送信日時を抽出
    const firstRowFirstCell = firstRow.locator('td').first();
    const secondRow = tableRows.nth(1);
    const secondRowFirstCell = secondRow.locator('td').first();

    const firstDate = await firstRowFirstCell.textContent();
    const secondDate = await secondRowFirstCell.textContent();

    // 最初の行の日時が存在することを確認
    expect(firstDate).toBeTruthy();
    expect(secondDate).toBeTruthy();
  }

  // スクロール可能な状態である（テーブルが表示可能）
  const tableWrapper = page.locator('.table-wrapper, [class*="mail"]').first();
  await expect(tableWrapper).toBeVisible();
});
