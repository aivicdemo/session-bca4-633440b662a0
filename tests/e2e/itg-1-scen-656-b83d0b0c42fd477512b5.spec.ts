import { test, expect } from '@playwright/test';

test('SCEN-656: リーダーのメールアドレスが無効化されている場合、警告が記録されて通知は送信されない', async ({
  page,
}) => {
  await page.goto('./panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出検知の定時処理をトリガー
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 検知ログセクションで警告が記録されていることを確認
  await page.click('[data-tab="log"]');
  const logSection = page.locator('#rm-log-tbody');
  const logContent = await logSection.textContent();
  expect(logContent).toMatch(/リーダーのメールアドレス無効化|通知送信失敗/);

  // 未提出者一覧に「通知送信失敗」フラグが表示されることを確認
  await page.click('[data-tab="reminder"]');
  const tbody = page.locator('#rm-missing-tbody');
  const tableContent = await tbody.textContent();
  expect(tableContent).toContain('通知送信失敗');
});
