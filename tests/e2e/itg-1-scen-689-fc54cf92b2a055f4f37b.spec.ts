import { test, expect } from '@playwright/test';

// SCEN-689: リーダーがリマインダー送信権限を持たない場合、操作が拒否される

test('リマインダー送信権限がない場合、操作が拒否される', async ({ page }) => {
  await page.goto('/panels/scr-1790147095974.html');

  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  const isDisabled = await sendReminderBtn.evaluate((el) => (el as HTMLButtonElement).disabled);

  if (isDisabled) {
    await expect(sendReminderBtn).toBeDisabled();
  } else {
    const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      await checkboxes.first().check();
      await sendReminderBtn.click();

      const permissionDeniedPattern = /権限がありません|この操作は許可されていません|アクセスが拒否されました/i;

      let errorFound = false;
      const toast = page.locator('#rm-toast');
      const toastText = await toast.textContent();

      if (toastText && permissionDeniedPattern.test(toastText)) {
        errorFound = true;
      }

      const alerts = page.evaluate(() => {
        return new Promise<string | null>((resolve) => {
          const originalAlert = window.alert;
          window.alert = (msg: string) => {
            window.alert = originalAlert;
            resolve(msg);
          };
          setTimeout(() => resolve(null), 1000);
        });
      });

      const alertMsg = await alerts;
      if (alertMsg && permissionDeniedPattern.test(alertMsg)) {
        errorFound = true;
      }

      expect(errorFound || isDisabled).toBe(true);
    }
  }
});
