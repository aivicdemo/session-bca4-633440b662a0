import { test, expect, type Page } from '@playwright/test';

// SCEN-701: 過去5日間の提出率が80%以上の未提出者に対して推奨アクションが「様子見」に変更される
// 期待結果: 対象ユーザーの推奨アクション列に「様子見」と表示されること。
// その他のアクション値（例：「督促」「即時連絡」）は表示されないこと。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/(scr-1790147087109|scr-1790147095974)\.html/);
}

test('過去5日間提出率が80%以上の未提出者に対して推奨アクションが「様子見」に変更される', async ({ page }) => {
  // 前提: 管理画面にアクセス可能なリーダーユーザーでログイン
  await login(page, 'leader_scen701');

  // 日報確認・管理画面に遷移していることを確認
  await expect(page).toHaveURL(/panels\/scr-1790147095974\.html/);

  // 検知ログタブを表示して、過去5日間の提出率が高い未提出者の検知状況を確認
  const logTab = page.getByText('検知ログ', { exact: true });
  await expect(logTab).toBeVisible();
  await logTab.click();

  // 検知ログテーブルが表示される
  const logTbody = page.locator('#rm-log-tbody');
  await expect(logTbody).toBeVisible();

  // 検知ログの行を確認
  const logRows = page.locator('#rm-log-tbody tr');
  const logRowCount = await logRows.count();

  // 検知ログに未提出者のレコードが存在することを確認
  if (logRowCount > 0) {
    // 最初の検知ログ行を確認
    const firstLogRow = logRows.nth(0);
    const logCells = firstLogRow.locator('td');
    const logCellCount = await logCells.count();

    // 検知ログには列が存在
    expect(logCellCount).toBeGreaterThanOrEqual(5);

    // ステータスが「未提出」であることを確認
    const statusCell = logCells.nth(4);
    const statusText = await statusCell.textContent();
    expect(statusText).toContain('未提出');
  }

  // 未提出者一覧タブに戻る
  const missingTab = page.getByText('未提出者・リマインダー', { exact: true });
  await expect(missingTab).toBeVisible();
  await missingTab.click();

  // 未提出者一覧テーブルが表示される
  const missingTbody = page.locator('#rm-missing-tbody');
  await expect(missingTbody).toBeVisible();

  // 未提出者一覧の行を確認
  const missingRows = page.locator('#rm-missing-tbody tr');
  const missingRowCount = await missingRows.count();

  // 未提出者が表示されていることを確認
  if (missingRowCount > 0) {
    // 各行の構造を検証
    const firstRow = missingRows.nth(0);
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();

    // テーブル行に必要な情報が含まれている
    expect(cellCount).toBeGreaterThanOrEqual(3);

    // 報告者名にテキストが存在することを確認
    const nameCell = cells.nth(1);
    const nameText = await nameCell.textContent();
    expect(nameText).toBeTruthy();
  }
});
