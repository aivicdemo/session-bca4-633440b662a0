import { test, expect, type Page } from '@playwright/test';

// SCEN-661: 検知ログ画面を開くと、未提出者の検知詳細情報（検知日時、対象者、検知ステータス、
// リマインダー送信状況）が表示される。
//
// panels/scr-1790147095974.html の「検知ログ」タブ（#rm-log-tbody）は、報告者名・対象日付・検知日時・
// リマインダー送信済み・提出状況の5列で構成されており、仕様が挙げる4項目（検知日時・対象者・検知ステータス・
// リマインダー送信状況）は「提出状況」列（未提出/提出済み）を検知ステータス、「リマインダー送信済み」列
// （送信済み/未送信）をリマインダー送信状況として対応させることができる。ただし検知日時の値
// （window.AIVIC_PAGE_INIT_JS 内の logs 配列、例 '2026-09-23 09:00'）は秒を含まない「年月日時分」形式であり、
// 仕様が求める「年月日時分秒形式」ではない。この食い違いは .aivic/batches/14/unresolved.md に記録する。
// 本テストは期待結果の文言（秒を含む形式）をそのまま検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('検知ログ画面に未提出者の検知日時・対象者・検知ステータス・リマインダー送信状況が表示される', async ({ page }) => {
  // 手順1: 日報確認・管理画面にログインする
  await login(page, 'leader_scen661');

  // 手順2: 画面左側メニューまたはナビゲーションから「検知ログ」項目をクリックする
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('検知ログ', { exact: true }).click();

  // 手順3: 検知ログ画面が表示されるまで待機する
  const rows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();

  // 手順4: 画面に表示される未提出者の検知ログ一覧テーブルを確認する
  const recorded = await rows.evaluateAll((trs) =>
    trs.map((tr) => {
      const cells = tr.querySelectorAll('td');
      return {
        target: cells[0]?.textContent?.trim() ?? '',
        detectedAt: cells[2]?.textContent?.trim() ?? '',
        reminderStatus: cells[3]?.textContent?.trim() ?? '',
        detectionStatus: cells[4]?.textContent?.trim() ?? '',
      };
    }),
  );
  expect(recorded.length).toBeGreaterThan(0);

  // (2) 対象者（社内ユーザー名）が各行に記載されている
  for (const r of recorded) {
    expect(r.target.length).toBeGreaterThan(0);
  }

  // (1) 検知日時（年月日時分秒形式）が各行に記載されている
  for (const r of recorded) {
    expect(r.detectedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  }

  // (3) 検知ステータス（「未提出」など定時検知で判定された状態）が各行に記載されている
  for (const r of recorded) {
    expect(['未提出', '提出済み']).toContain(r.detectionStatus);
  }

  // (4) リマインダー送信状況（「送信済み」「送信失敗」「未送信」など）が各行に記載されている
  for (const r of recorded) {
    expect(['送信済み', '送信失敗', '未送信']).toContain(r.reminderStatus);
  }

  // 少なくとも1件以上の未提出者検知ログレコードが表示されている
  const nonSubmitted = recorded.filter((r) => r.detectionStatus === '未提出');
  expect(nonSubmitted.length).toBeGreaterThan(0);
});
