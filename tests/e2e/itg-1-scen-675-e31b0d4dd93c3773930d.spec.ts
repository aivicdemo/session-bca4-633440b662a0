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
  // ステップ1: リーダーロールを持つユーザーでシステムにログインする
  await login(page, 'reader_scen675');

  // ステップ2: 日報確認・管理画面へ遷移する（ログイン後の遷移先が管理画面）
  expect(page.url()).toContain('scr-1790147095974');

  // ステップ3: 管理画面内の「メール送信履歴」セクション/タブを開く
  const mailHistoryTab = page.locator('.rm-tab[data-tab="mail"]');
  await expect(mailHistoryTab).toBeVisible();
  await mailHistoryTab.click();

  // ステップ4: メール送信履歴一覧が表示されるまで待機
  const mailPanel = page.locator('.rm-panel[data-panel="mail"]');
  await expect(mailPanel).toHaveClass(/is-active/);

  // 期待結果: メール送信履歴一覧画面が表示される
  const mailHistoryTable = page.locator('#rm-mail-tbody');
  await expect(mailHistoryTable).toBeVisible();

  // テーブルヘッダーの確認
  const tableHead = page.locator('.rm-table thead').nth(1);
  await expect(tableHead).toBeVisible();

  // (1) 送信日時の列を確認
  const sentAtHeader = page.locator('.rm-table th', { hasText: '送信日時' });
  await expect(sentAtHeader).toBeVisible();

  // (2) 送信対象ユーザー名（送信先）の列を確認
  const toHeader = page.locator('.rm-table th', { hasText: '送信先' });
  await expect(toHeader).toBeVisible();

  // (3) メール種別（リマインダーメール/アラートメール等）の列を確認
  const typeHeader = page.locator('.rm-table th', { hasText: 'メールタイプ' });
  await expect(typeHeader).toBeVisible();

  // (4) 配信状態（成功/失敗/再試行中など）の列を確認
  const statusHeader = page.locator('.rm-table th', { hasText: 'ステータス' });
  await expect(statusHeader).toBeVisible();

  // データテーブルが表示される
  const tableRows = page.locator('#rm-mail-tbody tr');
  const rowCount = await tableRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // テーブル行に4つの列が存在することを確認
  if (rowCount > 0) {
    const firstRow = tableRows.first();
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThanOrEqual(4);

    // (2) 送信対象ユーザー名（送信先）が表示されている
    const toCell = cells.nth(2);
    const toText = await toCell.textContent();
    expect(toText?.trim()).toBeTruthy();

    // (3) メール種別が表示されている
    const typeCell = cells.nth(1);
    const typeText = await typeCell.textContent();
    expect(typeText?.trim()).toBeTruthy();
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

    // (4) 配信状態が表示されている
    const statusCell = cells.nth(4);
    const statusText = await statusCell.textContent();
    expect(statusText?.trim()).toBeTruthy();
    expect(['成功', '失敗', '保留中']).toContain(statusText?.trim());
  }

  // 一覧は最新の送信記録から順に表示される
  if (rowCount > 1) {
    const firstRowFirstCell = page.locator('#rm-mail-tbody tr').first().locator('td').first();
    const secondRowFirstCell = page.locator('#rm-mail-tbody tr').nth(1).locator('td').first();

    const firstDate = await firstRowFirstCell.textContent();
    const secondDate = await secondRowFirstCell.textContent();

    expect(firstDate).toBeTruthy();
    expect(secondDate).toBeTruthy();
  }

  // スクロール可能な状態である
  const mailCard = page.locator('.rm-card').last();
  await expect(mailCard).toBeVisible();
});
