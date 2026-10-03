import { test, expect } from '@playwright/test';

// SCEN-686: 選択された未提出者に対してリマインダーメールが送信される

test('リマインダー送信対象者の複数選択と送信完了確認', async ({ page }) => {
  await page.goto('/panels/scr-1790147095974.html');

  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();

  if (checkboxCount < 1) {
    test.skip();
  }

  const selectedCount = Math.min(checkboxCount, 3);
  for (let i = 0; i < selectedCount; i++) {
    await checkboxes.nth(i).check();
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

  expect(confirmResult).toBe(true);

  const toast = page.locator('#rm-toast');
  await expect(toast).toContainText(/リマインダーを送信しました/, { timeout: 5000 });

  const firstRow = page.locator('#rm-missing-tbody tr').first();
  const statusCell = firstRow.locator('td').nth(3);
  const statusText = await statusCell.textContent();

  expect(statusText).toContain(/リマインダー送信済み|送信/i);
});
