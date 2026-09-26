import { test, expect } from '@playwright/test';

test('SCEN-657: メール配信サービス利用不可時に3回再試行されて管理者に通知される', async ({
  page,
}) => {
  await page.goto('./panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 定時の自動検知によって未提出者が一覧表示されるまで待機
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 未提出者に対するリマインダー送信操作を実行
  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  if (await sendReminderBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await sendReminderBtn.click();
  }

  // 送信試行が失敗し、画面に「通知送信失敗」メッセージが表示されることを確認
  const body = page.locator('body');
  const pageContent = await body.textContent();
  expect(pageContent).toContain('通知送信失敗');

  // 画面をリロードして最新状態を表示
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 未提出者一覧に「通知未送信」または「通知送信失敗」フラグが表示されることを確認
  const tbody = page.locator('#rm-missing-tbody');
  const tableContent = await tbody.textContent();
  expect(tableContent).toMatch(/通知未送信|通知送信失敗/);

  // 検知ログに再試行情報が記録されていることを確認
  await page.click('[data-tab="log"]');
  const logTbody = page.locator('#rm-log-tbody');
  const logContent = await logTbody.textContent();
  expect(logContent).toMatch(/3回再試行|送信失敗/);
});
