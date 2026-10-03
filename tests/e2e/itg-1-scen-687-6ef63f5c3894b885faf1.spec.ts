import { test, expect } from '@playwright/test';

// SCEN-687: リマインダー送信後の未提出者検知結果が更新されて管理画面に反映される

test('リマインダー送信後に管理画面の未提出者一覧が更新される', async ({ page }) => {
  await page.goto('/panels/scr-1790147095974.html');

  const missingRows1 = page.locator('#rm-missing-tbody tr');
  const initialRowCount = await missingRows1.count();

  if (initialRowCount === 0) {
    test.skip();
  }

  const initialFirstRow = missingRows1.first();
  const initialStatus = await initialFirstRow.locator('td').nth(3).textContent();

  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  if (await checkboxes.count() > 0) {
    await checkboxes.first().check();
  }

  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  await sendReminderBtn.click();

  const confirmResult = await page.evaluate(() => {
    return new Promise<boolean>((resolve) => {
      const originalConfirm = window.confirm;
      window.confirm = () => {
        window.confirm = originalConfirm;
        resolve(true);
        return true;
      };
      setTimeout(() => resolve(false), 1000);
    });
  });

  if (confirmResult) {
    const toast = page.locator('#rm-toast');
    await expect(toast).toContainText(/リマインダーを送信しました/, { timeout: 5000 });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const missingRows2 = page.locator('#rm-missing-tbody tr');
    const newFirstRow = missingRows2.first();
    const updatedStatus = await newFirstRow.locator('td').nth(3).textContent();

    expect(updatedStatus).not.toBe(initialStatus);
    expect(updatedStatus).toContain(/送信|リマインダー/i);
  }
});
