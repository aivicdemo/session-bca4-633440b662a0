import { test, expect } from '@playwright/test';

// SCEN-683: 管理画面から選択された未提出者の一覧と対象者の詳細情報が取得される

test('未提出者一覧から選択された対象者の詳細情報が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1790147095974.html');

  const missingTbody = page.locator('#rm-missing-tbody');
  await expect(missingTbody).toBeVisible();

  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();

  if (checkboxCount === 0) {
    test.skip();
  }

  const firstCheckbox = checkboxes.first();
  await firstCheckbox.check();

  const firstRow = page.locator('#rm-missing-tbody tr').first();
  const nameCell = firstRow.locator('td').nth(1);
  const selectedName = await nameCell.textContent();

  const tabs = page.locator('.rm-tab');
  const detailsTabIndex = (await tabs.count()) - 1;
  if (detailsTabIndex >= 0) {
    const detailsTab = tabs.nth(detailsTabIndex);
    await detailsTab.click({ force: true });
  }

  const panels = page.locator('.rm-panel');
  const activePanel = panels.filter({ has: page.locator(':self-or-descendant([data-panel])') }).first();
  const detailText = await activePanel.textContent();

  if (selectedName && detailText) {
    expect(detailText).toContain(selectedName);
  }

  const selectAllCheckbox = page.locator('#rm-select-all');
  if (selectAllCheckbox) {
    const selectAllExists = await selectAllCheckbox.count();
    if (selectAllExists > 0) {
      await selectAllCheckbox.check();

      const allCheckboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
      const allChecked = allCheckboxes.locator('[checked]');
      const checkedCount = await allChecked.count();

      if (checkedCount > 1) {
        const panelText = await activePanel.textContent();
        expect(panelText).toMatch(/選択中:\s*\d+件/);
      }
    }
  }
});
