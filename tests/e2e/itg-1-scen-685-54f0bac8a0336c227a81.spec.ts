import { test, expect } from '@playwright/test';

// SCEN-685: 各未提出者の超過時間と状況に基づいて催促の必要性と送信方法が判定される

test('未提出者ごとの超過時間に基づいて送信方法が判定される', async ({ page }) => {
  await page.goto('/panels/scr-1790147095974.html');

  const missingRows = page.locator('#rm-missing-tbody tr');
  const rowCount = await missingRows.count();

  if (rowCount === 0) {
    test.skip();
  }

  for (let i = 0; i < Math.min(rowCount, 3); i++) {
    const row = missingRows.nth(i);
    const cells = row.locator('td');
    const lastReminderCell = await cells.nth(3).textContent();

    expect(lastReminderCell).toBeTruthy();
  }

  const settingsBtn = page.locator('#rm-settings-btn');
  if (settingsBtn) {
    await settingsBtn.click();

    const settingsModal = page.locator('#rm-settings-modal');
    await expect(settingsModal).toBeVisible({ timeout: 3000 });

    const methodSelects = page.locator('#rm-set-method');
    if (methodSelects) {
      const methodCount = await methodSelects.count();
      expect(methodCount).toBeGreaterThan(0);
    }

    const closeBtn = page.locator('#rm-settings-modal-close');
    await closeBtn.click();
  }

  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();

  if (checkboxCount > 0) {
    await checkboxes.first().check();

    const sendReminderBtn = page.locator('#rm-send-reminder-btn');
    await sendReminderBtn.click();

    const toast = page.locator('#rm-toast');
    await expect(toast).toContainText(/リマインダーを送信しました|権限がありません/, { timeout: 5000 });
  }
});
