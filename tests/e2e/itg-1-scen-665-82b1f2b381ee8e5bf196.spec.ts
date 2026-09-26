import { test, expect } from '@playwright/test';

/**
 * SCEN-665: 検知ログ確認
 * 検知ログ画面で、リマインダーメール送信済みの未提出者に
 * 「リマインダー送信済み」ステータスが表示される
 */
test('リマインダーメール送信済みの未提出者に「リマインダー送信済み」ステータスが表示される', async ({ page }) => {
  // 1. 管理者として日報確認・管理画面にログインする
  await page.goto('/');
  await page.fill('input[type="text"]', 'admin_yamada');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');

  await page.waitForLoadState('networkidle');

  // 2. 日報確認・管理画面の未提出者一覧から、
  // リマインダーメール送信済みのユーザーを特定する
  const reminderTab = page.locator('.rm-tab').filter({ hasText: '未提出者' });
  await reminderTab.click();

  await page.waitForLoadState('networkidle');

  const reminderTable = page.locator('#rm-missing-tbody');
  await expect(reminderTable).toBeVisible();

  // 3. 日報確認・管理画面内の「検知ログ」または「メール送信履歴」セクションに遷移する
  const logTab = page.locator('.rm-tab').filter({ hasText: '検知ログ' });
  await logTab.click();

  await page.waitForLoadState('networkidle');

  // 4. 検索条件またはフィルタで、手順2で特定したユーザーの
  // リマインダーメール送信記録を検索する
  const logTable = page.locator('.rm-table');
  await expect(logTable).toBeVisible();

  // 5. 該当ユーザーの送信記録行を画面上で確認する
  const rows = logTable.locator('tbody tr');
  const rowCount = await rows.count();

  let reminderSentFound = false;

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.locator('td');

    // リマインダー送信済みを示す列を確認
    const reminderStatusCell = cells.nth(3);
    const reminderStatus = await reminderStatusCell.textContent();

    if (reminderStatus?.includes('送信済み')) {
      reminderSentFound = true;

      // ステータス列に「リマインダー送信済み」と表示されていることを確認
      expect(reminderStatus).toContain('送信済み');

      // 送信日時、送信先メールアドレス、送信種別（リマインダー）が画面に表示される
      const reporterName = await cells.nth(0).textContent();
      const detectedAt = await cells.nth(2).textContent();

      expect(reporterName).toBeTruthy();
      expect(detectedAt).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/);

      break;
    }
  }

  // リマインダー送信済みの記録が検索結果に表示されていることを確認
  expect(reminderSentFound).toBe(true);
});
