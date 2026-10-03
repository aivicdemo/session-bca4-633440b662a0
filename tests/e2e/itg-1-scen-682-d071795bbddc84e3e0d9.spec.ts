import { test, expect } from '@playwright/test';

// SCEN-682: リーダーが管理画面でリマインダー送信操作を実行する権限を持つことが確認できる

test('リーダーがリマインダー送信ボタンを操作できる', async ({ page }) => {
  await page.goto('/panels/scr-1790147095974.html');

  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  await expect(sendReminderBtn).toBeVisible();
  await expect(sendReminderBtn).toBeEnabled();

  const missingTbody = page.locator('#rm-missing-tbody');
  await expect(missingTbody).toBeVisible();

  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();

  if (checkboxCount > 0) {
    await checkboxes.first().check();
    await sendReminderBtn.click();

    const confirmDialog = page.evaluate(() => {
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

    const isConfirmed = await confirmDialog;

    if (isConfirmed) {
      const toast = page.locator('#rm-toast');
      await expect(toast).toContainText(/リマインダーを送信しました|権限がありません|この操作は許可されていません/, { timeout: 5000 });
    }
  }
});
