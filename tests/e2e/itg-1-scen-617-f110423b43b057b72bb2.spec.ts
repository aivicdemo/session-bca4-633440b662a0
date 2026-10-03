import { test, expect } from '@playwright/test';

test('SCEN-617: 報告者が送信履歴確認画面を開き、自分の日報に関連するメール送信履歴が表示される', async ({ page }) => {
  // ログイン画面にアクセス
  await page.goto('/login.html');

  // 報告者ユーザーでログイン
  await page.fill('[data-testid="username"]', 'reporter1');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // 日報入力・提出画面が表示されるまで待機
  await page.waitForNavigation();
  await expect(page).toHaveURL(/panels\/scr-1790147087109/);

  // 日報を入力
  await page.fill('#rp-content', '本日は顧客Aとの打ち合わせを実施し、新要件を確認した。');

  // 妥当性チェックを経て提出
  await page.click('#rp-submit-btn');

  // 提出完了まで待機
  await page.waitForSelector('#rp-success');

  // 提出完了後、日報確認・管理画面へ遷移
  await page.waitForNavigation();
  await expect(page).toHaveURL(/panels\/scr-1790147095974/);

  // 日報確認・管理画面の左側メニューまたはナビゲーション要素から「送信履歴確認」機能を開く
  const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' }).first();
  await mailHistoryTab.click();

  // 送信履歴確認画面が表示されるまで待機
  await page.waitForSelector('#rm-mail-tbody');

  // 表示された送信履歴一覧の内容を確認
  const mailTable = page.locator('#rm-mail-tbody');
  const rows = mailTable.locator('tr');

  // 1件以上の送信履歴が表示されることを確認
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThanOrEqual(1);

  // 最初の行の内容を確認
  const firstRow = rows.first();
  const cells = firstRow.locator('td');

  // 送信日時が含まれていることを確認
  const sentAt = await cells.nth(0).textContent();
  expect(sentAt).toBeTruthy();

  // 送信対象メールアドレスが含まれていることを確認
  const recipient = await cells.nth(2).textContent();
  expect(recipient).toBeTruthy();
  expect(recipient).toMatch(/@.*\./);

  // 送信種別（メールタイプ）が含まれていることを確認
  const emailType = await cells.nth(1).textContent();
  expect(emailType).toBeTruthy();

  // 配信状態（ステータス）が含まれていることを確認
  const status = await cells.nth(4).textContent();
  expect(status).toBeTruthy();
  expect(['成功', '失敗', '保留中']).toContain(status?.trim());
});
