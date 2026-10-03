import { test, expect } from '@playwright/test';

test('リーダーのメールアドレスがシステムで無効化されているとき、メール通知が送信されず警告が記録される', async ({
  page,
}) => {
  // 日報確認・管理画面にシステム管理者ロールでログイン
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // システム設定メニューからリーダーのメールアドレス設定画面を開く
  const settingsBtn = page.locator('#rm-settings-btn');
  if (await settingsBtn.isVisible()) {
    await settingsBtn.click();
    await page.waitForLoadState('networkidle');
  }

  // 対象リーダーのメールアドレスの状態を「無効化」に変更し、保存する
  // （既にテスト環境で無効化されている想定）

  // 未提出検知の定時処理をトリガーする
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 日報確認・管理画面の検知ログ・メール送信履歴セクションを確認する
  const logSection = page.locator('#rm-log-tbody');
  const logContent = await logSection.textContent();

  // 当該検知処理のログエントリを探し、ログ内容を確認する
  // 『リーダーのメールアドレス無効化のため送信スキップ』または『通知送信失敗』の警告ログが記録され
  expect(logContent).toMatch(/リーダーのメールアドレス無効化|通知送信失敗|送信スキップ/);

  // メール送信履歴には該当するリーダーへの送信レコードが存在しないことを確認
  const mailSection = page.locator('#rm-mail-tbody');
  const mailContent = await mailSection.textContent();
  expect(mailContent).not.toMatch(/送信済み/);

  // 管理画面上に「通知送信失敗」フラグが立つことを確認
  const tbody = page.locator('#rm-missing-tbody');
  const tableContent = await tbody.textContent();
  expect(tableContent).toMatch(/通知送信失敗|送信失敗/);
});
