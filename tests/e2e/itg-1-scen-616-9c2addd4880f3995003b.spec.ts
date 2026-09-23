import { test, expect, type Page } from '@playwright/test';

// SCEN-616: メール通知本文に報告者名、日報内容、送信日時が正確に含まれて送信される。

const REPORT_CONTENT = '今日のタスク：システムAの機能改善、システムBのバグ修正';

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('メール送信履歴の詳細に報告者名・日報内容・送信日時が正確に反映されている', async ({ page }) => {
  const reporterName = 'reporter_scen616';
  await login(page, reporterName);

  const submittedAt = Date.now();

  const textarea = page.locator('#rp-content');
  const submitBtn = page.locator('#rp-submit-btn');
  const validation = page.locator('#rp-validation');

  await textarea.fill(REPORT_CONTENT);
  await expect(validation).toHaveText(/入力OK/);
  await expect(submitBtn).toBeEnabled();

  await submitBtn.click();

  const success = page.locator('#rp-success');
  await expect(success).toBeVisible({ timeout: 5000 });

  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  await page.locator('.rm-tab[data-tab="mail"]').click();

  const matchingMailRow = page.locator('#rm-mail-tbody tr', { hasText: reporterName });
  await expect(matchingMailRow).toHaveCount(1);

  // メール送信履歴の詳細情報（本文内容）を画面上で確認する。
  await matchingMailRow.locator('.rm-detail-btn').click();
  const modalBody = page.locator('#rm-view-modal-body');

  // (1) 報告者名がログイン中のユーザー名と一致する。
  await expect(modalBody).toContainText(reporterName);
  // (2) 日報内容が含まれている。
  await expect(modalBody).toContainText(REPORT_CONTENT);
  // (3) 送信日時がシステムの現在日時（年月日 時分秒）と一致している。
  const sentAtText = await modalBody.textContent();
  const sentAtMatch = sentAtText?.match(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/);
  expect(sentAtMatch).not.toBeNull();
  const sentAtValue = sentAtMatch ? Date.parse(sentAtMatch[0].replace(' ', 'T')) : NaN;
  expect(sentAtValue).toBeGreaterThanOrEqual(submittedAt - 5000);
  expect(sentAtValue).toBeLessThanOrEqual(Date.now());
});
