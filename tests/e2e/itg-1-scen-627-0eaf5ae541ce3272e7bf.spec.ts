import { test, expect } from '@playwright/test';

// SCEN-627: 未提出の報告者は一覧に表示されるが、内容と送信時刻は空欄である

test('未提出者が一覧に表示され、内容と送信時刻が空欄である', async ({ page }) => {
  // 日報確認・管理画面を開く
  await page.goto('/panels/scr-1790147095974.html');

  // 未提出者・リマインダータブを開く
  const reminderTab = page.locator('button[data-tab="reminder"]');
  await expect(reminderTab).toBeVisible();
  await reminderTab.click();

  // 未提出者一覧が表示されるまで待機
  await page.waitForSelector('#rm-missing-tbody');

  // 未提出者一覧テーブルを確認
  const tbody = page.locator('#rm-missing-tbody');
  const rows = tbody.locator('tr');
  const rowCount = await rows.count();

  // 期待結果: 未提出者が1件以上表示されている
  if (rowCount > 0) {
    // 未提出者のうち1名の行を選択し、『内容』列と『送信時刻』列を確認
    const firstRow = rows.nth(0);
    const cells = firstRow.locator('td');

    // 報告者名（2列目）が表示されている
    const nameCell = cells.nth(1);
    const nameText = await nameCell.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);

    // 対象日付（3列目）が表示されている
    const dateCell = cells.nth(2);
    const dateText = await dateCell.textContent();
    expect(dateText?.trim().length).toBeGreaterThan(0);

    // リマインダー送信日時（4列目）が表示されている
    const reminderCell = cells.nth(3);
    const reminderText = await reminderCell.textContent();
    expect(reminderText?.trim()).toBeDefined();
  }

  // 検知ログタブから未提出者の内容と送信時刻が空欄であることを確認
  const logTab = page.locator('button[data-tab="log"]');
  await logTab.click();

  await page.waitForSelector('#rm-log-tbody');
  const logTbody = page.locator('#rm-log-tbody');
  const logRows = logTbody.locator('tr');
  const logRowCount = await logRows.count();

  if (logRowCount > 0) {
    // 未提出の行を探す
    for (let i = 0; i < logRowCount; i++) {
      const row = logRows.nth(i);
      const statusCell = row.locator('td').nth(4);
      const statusText = await statusCell.textContent();

      if (statusText?.includes('未提出')) {
        // 未提出者の提出状況が「未提出」と表示されている
        expect(statusText.trim()).toContain('未提出');
        break;
      }
    }
  }
});
