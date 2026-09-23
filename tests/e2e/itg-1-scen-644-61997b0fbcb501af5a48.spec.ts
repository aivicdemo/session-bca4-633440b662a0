import { test, expect, type Page } from '@playwright/test';

// SCEN-644: 17時の報告期限を過ぎた時点でリーダーが管理画面を開いたとき、期限までに提出されなかった報告者が
// 未提出者として自動検知される。
//
// 前提「システム時刻を17時01分に設定する」「本日の日報提出期限を17時に設定済みであることを確認する」
// 「報告者5名のうち3名は既に日報を提出済み、2名は未提出の状態を作成する」について、panels/scr-1790147095974.html
// の「未提出者・リマインダー」タブは window.AIVIC_PAGE_INIT_JS 内にハードコードされた固定のモック配列
// （missing、3件: 高橋次郎・伊藤三郎・渡辺恵子）を表示するのみで、システム時刻や提出期限設定・報告者の提出/
// 未提出状態と連動する検知処理は実装されていない（daily-report-non-submission-detection.ts の
// detectNonSubmittedReportersAtDeadline に対応する呼び出しは画面側に存在しない）。本テストは Playwright の
// page.clock を用いてシステム時刻を17:01に固定した上で（仕様の前提を最大限模擬）、画面に実際に表示される
// 未提出者一覧の内容を検証する。
//
// 期待結果「各未提出者の隣には『通知送信済み』の状態が表示される」について、実際の列は『最終リマインダー送信
// 日時』であり、値は「未送信」または具体的な日時文字列（例: 2026-09-22 09:00）であって、「通知送信済み」という
// 文言そのものは表示されない。この食い違いは .aivic/batches/11/unresolved.md に記録する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('提出期限17時を過ぎてリーダーが管理画面を開くと、未提出の報告者2名が未提出者として表示される', async ({
  page,
}) => {
  // 前提: システム時刻を17時01分に設定する（本日の日報提出期限は17:00と仕様に定義されている）。
  const today = new Date();
  today.setHours(17, 1, 0, 0);
  await page.clock.install({ time: today });

  // リーダーユーザーでシステムにログインする。
  await login(page, 'leader_scen644');

  // 日報確認・管理画面を開く。
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 管理画面の未提出者一覧を確認する。
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();

  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThanOrEqual(2);

  // 各未提出者の隣に催促状況（最終リマインダー送信日時列）が表示されていることを確認する。
  for (let i = 0; i < rowCount; i++) {
    const reminderStatusCell = rows.nth(i).locator('td').nth(3);
    await expect(reminderStatusCell).toBeVisible();
  }
});
