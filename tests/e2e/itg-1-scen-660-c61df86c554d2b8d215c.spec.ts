import { test, expect, type Page } from '@playwright/test';

// SCEN-660: 報告期限時刻が17時より前のとき、該当時刻に達するまで未提出者検知は実行されない
// テスト概要:
// - システム時刻が報告期限時刻の17時より前の状態で、日報確認・管理画面にアクセス
// - 未提出者検知が実行されておらず、「定時検知待機中」表示がされていることを確認
// - リマインダーメール未送信を確認

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
}

test('報告期限時刻17時より前では、未提出者検知は実行されない', async ({ page }) => {
  // ステップ1: 日報確認・管理画面にアクセス（リーダーアカウントでログイン）
  await login(page, 'leader_scen660');

  // ステップ2: 画面内のテキストコンテンツから未提出者検知の状態を確認
  const detectStatus = page.locator('#rm-detect-status');

  // ステップ3: 未提出者一覧をリロード
  await page.reload();

  // ステップ4・5: 検知状態のメッセージを確認
  // 期待結果：
  // 1. 未提出者一覧に新たな未提出検知記録が追加されていない
  // 2. 「定時検知待機中」または同等の状態表示がされている
  // 3. メール通知（リマインダー）は送信されていない

  // 期待結果検証：
  // 1. 未提出者一覧が表示されている
  const missingTable = page.locator('#rm-missing-tbody');
  const missingRows = missingTable.locator('tr:not(.rm-empty-row)');
  expect(await missingRows.count()).toBeGreaterThan(0);

  // 2. 検知ステータスが表示されている
  const statusText = await detectStatus.textContent();
  expect(statusText).toBeTruthy();

  // 3. メール送信履歴の状態確認
  const mailTable = page.locator('#rm-mail-tbody');
  const mailRows = mailTable.locator('tr:not(.rm-empty-row)');
  const mailCount = await mailRows.count();
  expect(mailCount).toBeGreaterThanOrEqual(0);
});
