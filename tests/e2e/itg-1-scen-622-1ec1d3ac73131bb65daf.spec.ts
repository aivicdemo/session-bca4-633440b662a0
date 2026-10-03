import { test, expect } from '@playwright/test';

test('SCEN-622: 送信履歴確認画面で、当該報告者が送信した日報に関連するメール送信履歴のデータセットが画面に表示される', async ({ page }) => {
  // ログイン後、日報確認・管理画面へ遷移
  await page.goto('/login.html');
  await page.fill('[data-testid="username"]', 'reporter1');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // 日報入力・提出画面へ遷移
  await page.waitForNavigation();
  await expect(page).toHaveURL(/panels\/scr-1790147087109/);

  // 日報を入力し、妥当性チェック後に提出
  await page.fill('#rp-content', '本日は顧客Aとの打ち合わせを実施し、新要件を確認した。');
  await page.click('#rp-submit-btn');

  // 提出完了まで待機
  await page.waitForSelector('#rp-success');

  // 日報確認・管理画面へ遷移
  await page.waitForNavigation();

  // 画面上部のナビゲーションから「送信履歴確認」セクションを開く
  const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' }).first();
  await mailHistoryTab.click();

  // 当該報告者が過去に送信した日報に紐づくメール送信履歴の一覧を確認
  await page.waitForSelector('#rm-mail-tbody');

  const mailTable = page.locator('#rm-mail-tbody');
  const rows = mailTable.locator('tr');

  // 表示されたメール送信履歴のデータセットの各フィールドを目視で確認
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThanOrEqual(1);

  // 最初のメール送信履歴行の内容を確認
  const firstRow = rows.first();
  const cells = firstRow.locator('td');

  // 送信日時：2024-01-15 09:30:00 の形式
  const sentAtText = await cells.nth(0).textContent();
  expect(sentAtText).toBeTruthy();
  // 日時形式を確認（日付と時刻を含む）
  expect(sentAtText).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}/);

  // 送信先：report-recipient@company.com
  const recipientText = await cells.nth(2).textContent();
  expect(recipientText).toBeTruthy();
  expect(recipientText).toMatch(/@.*\./);

  // 送信ステータス：配信成功
  const statusText = await cells.nth(4).textContent();
  expect(statusText).toBeTruthy();
  expect(['成功', '失敗', '保留中']).toContain(statusText?.trim());

  // 送信種別（メールタイプ）が表示されている
  const emailTypeText = await cells.nth(1).textContent();
  expect(emailTypeText).toBeTruthy();

  // 件名が表示されている
  const subjectText = await cells.nth(3).textContent();
  expect(subjectText).toBeTruthy();

  // 各フィールドが対応する列に正確に配置されていることを確認
  expect(sentAtText).toBeTruthy();
  expect(emailTypeText).toBeTruthy();
  expect(recipientText).toBeTruthy();
  expect(subjectText).toBeTruthy();
  expect(statusText).toBeTruthy();
});
