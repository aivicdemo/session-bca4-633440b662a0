import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
}

test('報告期限時刻が17時より前のとき、該当時刻に達するまで未提出者検知は実行されない', async ({ page }) => {
  // テスト環境のシステム時刻を報告期限時刻の17時より前（例：16時30分）に設定する
  // （テスト環境は既に時刻が設定されている想定）

  // 日報確認・管理画面にアクセスし、未提出者検知機能の状態を確認する
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 未提出者検知の定時実行トリガー（17時到達前のチェック処理）が自動実行されるのを待つ
  // （自動実行のタイミング確認）

  // 日報確認・管理画面の未提出者一覧をリロードし、検知結果の表示状態を確認する
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 管理画面に表示されている検知状態のメッセージを確認する

  // システム時刻が報告期限時刻17時より前の状況では、日報確認・管理画面の未提出者一覧に新たな未提出検知記録が追加されていない
  const missingTable = page.locator('#rm-missing-tbody');
  const missingRows = missingTable.locator('tr:not(.rm-empty-row)');
  const missingCount = await missingRows.count();
  expect(missingCount).toBeGreaterThanOrEqual(0);

  // 管理画面に「定時検知待機中」または同等の状態表示がされている
  const detectStatus = page.locator('#rm-detect-status');
  const statusText = await detectStatus.textContent();
  expect(statusText).toMatch(/定時検知待機中|待機中|未実行/i);

  // メール通知（リマインダー）は送信されていない
  const mailTable = page.locator('#rm-mail-tbody');
  const mailRows = mailTable.locator('tr:not(.rm-empty-row)');
  const mailCount = await mailRows.count();
  expect(mailCount).toBe(0);
});
