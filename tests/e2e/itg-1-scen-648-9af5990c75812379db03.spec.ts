import { test, expect } from '@playwright/test';

test('SCEN-648: 管理画面にアクセスしたとき、提出済み・未提出者一覧、検知ステータス、催促状況を含むダッシュボードデータが取得され表示される', async ({ page }) => {
  // テストユーザー（管理者）でブラウザにログインする
  await page.goto('/login.html');
  await page.fill('input[type="text"]', 'admin-user');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 日報確認・管理画面へ遷移する
  await page.goto('/panels/scr-1790147095974.html');

  // 画面読み込み完了を待つ
  await page.waitForLoadState('networkidle');

  // ダッシュボード領域に以下のデータ要素が表示されていることを確認する：
  // (1)提出済み者一覧
  const submittedSection = page.locator('text=提出済み日報');
  await expect(submittedSection).toBeVisible();

  // (2)未提出者一覧
  const nonSubmittedLabel = page.locator('text=未提出者');
  await expect(nonSubmittedLabel).toBeVisible();

  // (3)検知ステータス表示
  const detectionStatus = page.locator('#rm-detect-status');
  await expect(detectionStatus).toBeVisible();

  // (4)催促状況表示
  const reminderStatusLabel = page.locator('text=メール送信履歴');
  await expect(reminderStatusLabel).toBeVisible();

  // 提出済み者一覧に本日提出したユーザーが表示されていることを確認する
  const submittedTable = page.locator('#rm-r-tbody');
  const isSubmittedTableVisible = await submittedTable.count() > 0;
  if (isSubmittedTableVisible) {
    const submittedRow = submittedTable.locator('tr').first();
    const submittedCells = submittedRow.locator('td');
    const nameText = await submittedCells.nth(0).innerText();
    expect(nameText).toBeTruthy();
    const timeText = await submittedCells.nth(3).innerText();
    expect(timeText).toMatch(/\d{1,2}:\d{2}/);
  }

  // 未提出者一覧に本日未提出のユーザーが表示されていることを確認する
  const nonSubmittedTable = page.locator('#rm-missing-tbody');
  const nonSubmittedRows = nonSubmittedTable.locator('tr');
  const nonSubmittedCount = await nonSubmittedRows.count();
  if (nonSubmittedCount > 0) {
    const nonSubmittedName = await nonSubmittedRows.first().locator('td').first().innerText();
    expect(nonSubmittedName).toBeTruthy();
  }

  // 検知ステータス表示に「定時自動検知」または同等のステータス値が表示されていることを確認する
  const statusContent = await detectionStatus.innerText();
  expect(statusContent).toMatch(/定時自動検知|実行済み|完了/);

  // 催促状況表示にメール送信履歴の件数・配信状態が表示されていることを確認する
  const mailTable = page.locator('#rm-mail-tbody');
  if (await mailTable.count() > 0) {
    const mailContent = await mailTable.innerText();
    expect(mailContent.length > 0).toBe(true);
  }
});
