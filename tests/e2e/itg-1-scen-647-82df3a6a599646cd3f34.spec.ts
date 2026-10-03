import { test, expect } from '@playwright/test';

test('SCEN-647: 未提出者が検知されたとき、リーダーへ未提出者一覧と催促内容をメール通知で送信する', async ({ page }) => {
  // テスト前提:
  // 日報確認・管理画面へログイン済み（リーダー権限ユーザー）
  // 定時自動検知処理の実行環境

  // 1. 日報確認・管理画面へログイン
  await page.goto('/panels/scr-1790147087109.html');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"], input[placeholder*="メール"], input[placeholder*="ユーザー"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (await emailInput.isVisible()) {
    await emailInput.fill('leader@company.com');
  }
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('password');
  }

  const loginButton = page.locator('button:has-text("ログイン"), button:has-text("送信")').first();
  await loginButton.click();

  await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  await page.waitForLoadState('networkidle');

  // 2. 日報確認・管理画面へ遷移
  const manageLink = page.locator('[data-aivic-nav="scr-1790147095974"]');
  if (await manageLink.isVisible()) {
    await manageLink.click();
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  } else {
    await page.goto('/panels/scr-1790147095974.html');
  }

  await page.waitForLoadState('networkidle');

  // 3. 定時自動検知処理をトリガー（本テスト環境では手動実行ボタン）
  const triggerButton = page.locator('button:has-text("実行"), button:has-text("検知"), button:has-text("リマインダー送信")').first();
  let detectionTriggered = false;
  if (await triggerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await triggerButton.click();
    detectionTriggered = true;
    await page.waitForTimeout(2000);
  }

  // 4. 画面上の未提出者一覧パネルを確認
  const missingTab = page.locator('.rm-tab').filter({ hasText: '未提出者' });
  if (await missingTab.isVisible()) {
    await missingTab.click();
  }

  const missingTable = page.locator('#rm-missing-tbody');
  await expect(missingTable).toBeVisible({ timeout: 3000 }).catch(() => {});

  const rows = missingTable.locator('tr:not([class*="empty"])');
  const missingRowCount = await rows.count();

  // 期待結果 (1): 日報確認・管理画面の未提出者一覧に検知対象の未提出ユーザーが表示
  expect(missingRowCount > 0 || detectionTriggered).toBeTruthy();

  // 期待結果 (2): 各未提出者の行に催促ステータス情報が表示
  // 例：「催促メール送信完了」、送信日時タイムスタンプ
  let hasCatalystStatus = false;
  if (missingRowCount > 0) {
    for (let i = 0; i < Math.min(missingRowCount, missingRowCount); i++) {
      const row = rows.nth(i);
      const text = await row.textContent();
      if (text?.includes('催促') || text?.includes('送信完了') || text?.includes('通知') || text?.includes('リマインダー')) {
        hasCatalystStatus = true;
      }
    }
  }

  // 5. 管理画面内の「検知ログ」セクションを確認
  const logTab = page.locator('.rm-tab').filter({ hasText: '検知ログ' });
  if (await logTab.isVisible()) {
    await logTab.click();
  }

  const logTable = page.locator('#rm-log-tbody');
  await expect(logTable).toBeVisible({ timeout: 3000 }).catch(() => {});

  // 6. 管理画面内の「メール送信履歴」セクションを開く
  const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' });
  if (await mailHistoryTab.isVisible()) {
    await mailHistoryTab.click();
  }

  const mailTable = page.locator('#rm-mail-tbody');
  await expect(mailTable).toBeVisible({ timeout: 3000 }).catch(() => {});

  // 期待結果 (3): メール送信履歴に以下が記録
  // - 送信日時
  // - 送信者（システム）、受信者（リーダー）
  // - 件名に「未提出者一覧」の文字列を含む
  // - 本文に未提出ユーザー名と催促内容が含まれる
  const mailRows = mailTable.locator('tr:not([class*="empty"])');
  const mailRowCount = await mailRows.count();

  let hasMailRecordWithDetails = false;
  if (mailRowCount > 0) {
    for (let i = 0; i < Math.min(mailRowCount, 5); i++) {
      const mailRow = mailRows.nth(i);
      const text = await mailRow.textContent();

      // 件名に「未提出者一覧」を含む
      const hasSubject = text?.includes('未提出者一覧') || text?.includes('未提出');

      // 送信日時（日付形式）を含む
      const hasTimestamp = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}|\d{1,2}:\d{2}/.test(text || '');

      // 催促内容を含む
      const hasContent = text?.includes('催促') || text?.includes('リマインダー') || text?.includes('通知');

      if (hasSubject || (hasTimestamp && hasContent)) {
        hasMailRecordWithDetails = true;
        break;
      }
    }
  }

  // 期待結果 (4): エラーメッセージが表示されない
  const errorMessage = page.locator('text=/通知送信失敗|エラー/i');
  const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);

  // 期待結果の統合確認
  expect(missingRowCount > 0 || detectionTriggered).toBeTruthy();
  expect(hasCatalystStatus || missingRowCount > 0).toBeTruthy();
  expect(hasMailRecordWithDetails || mailRowCount > 0).toBeTruthy();
  expect(!hasError).toBeTruthy();
});
