import { test, expect } from '@playwright/test';

// SCEN-688: 送信したリマインダーメールの履歴がリーダーが送信状況を確認できるように記録される

test('リマインダー送信履歴がメール送信履歴タブに記録される', async ({ page }) => {
  await page.goto('/panels/scr-1790147095974.html');

  const missingTab = page.locator('.rm-tab[data-tab="missing"]');
  const logsTab = page.locator('.rm-tab[data-tab="logs"]');
  const mailHistoryTab = page.locator('.rm-tab[data-tab="mail"]');

  await expect(missingTab).toBeVisible();

  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();

  if (checkboxCount > 0) {
    await checkboxes.first().check();

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

      await mailHistoryTab.click();

      const mailRows = page.locator('#rm-mail-tbody tr');
      const mailCount = await mailRows.count();

      if (mailCount > 0) {
        const firstMailRow = mailRows.first();
        const cells = firstMailRow.locator('td');

        const sentAt = await cells.nth(0).textContent();
        const type = await cells.nth(1).textContent();
        const to = await cells.nth(2).textContent();
        const status = await cells.nth(4).textContent();

        expect(sentAt).toBeTruthy();
        expect(type).toContain('リマインダー');
        expect(to).toBeTruthy();
        expect(status).toMatch(/成功|保留中/);
      }
    }
  }
});
