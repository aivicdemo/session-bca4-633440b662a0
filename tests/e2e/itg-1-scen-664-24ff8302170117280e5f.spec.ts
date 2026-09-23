import { test, expect, type Page } from '@playwright/test';

// SCEN-664: 検知ログ画面で、各未提出者の最後の提出日時が正しく表示される。
//
// panels/scr-1790147095974.html の「検知ログ」タブ（#rm-log-tbody）の列は 報告者名・対象日付・検知日時・
// リマインダー送信済み・提出状況 の5列（＋詳細ボタン）のみで、「最後の提出日時」という列は存在しない。
// 「未提出者・リマインダー」タブ（#rm-missing-tbody）にも 報告者名・対象日付・最終リマインダー送信日時 の
// 列があるのみで、これは「リマインダーを最後に送った日時」であり、仕様が期待する「（各報告者が）最後に
// 日報を提出した日時」とは意味が異なる。また、いずれのタブも AIVIC_PAGE_INIT_JS 内にハードコードされた
// 3件（高橋次郎・伊藤三郎・渡辺恵子）の固定配列を表示するのみで、テスト用DBに登録した「報告者A～E」やその
// 提出日時（2024-01-15 09:30:00 等）を反映する仕組みは存在しない。この食い違いは
// .aivic/batches/15/unresolved.md に記録する。本テストは仕様の期待結果の文言（列名・報告者名・提出日時）に
// 忠実に検証を記述する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('検知ログ画面の未提出者一覧に、各未提出者の最後の提出日時が正しく表示される', async ({ page }) => {
  // 日報確認・管理画面にログインする（テスト用DBに報告者A～E・提出履歴・未提出状態を用意した前提）。
  await login(page, 'admin_scen664');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 検知ログ確認機能（検知ログタブ）を表示する。
  await page.locator('.rm-tab[data-tab="log"]').click();
  const logPanel = page.locator('[data-panel="log"]');
  await expect(logPanel).toBeVisible();

  // 検知ログ画面内の「未提出者一覧」セクションで表示される「最後の提出日時」カラムを確認する。
  await expect(logPanel.getByRole('columnheader', { name: '最後の提出日時' })).toBeVisible();

  // 報告者A・B・Cの最後の提出日時が設定したデータベース値と一致していることを確認する。
  const logRows = logPanel.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  const rowA = logRows.filter({ hasText: '報告者A' });
  await expect(rowA).toContainText('2024-01-15 09:30:00');
  const rowB = logRows.filter({ hasText: '報告者B' });
  await expect(rowB).toContainText('2024-01-10 14:45:00');
  const rowC = logRows.filter({ hasText: '報告者C' });
  await expect(rowC).toContainText('2024-01-05 11:20:00');

  // 報告者D・Eについては「最後の提出日時」が空欄または「未提出」と表示される。
  const rowD = logRows.filter({ hasText: '報告者D' });
  await expect(rowD).toContainText(/未提出|^$/);
  const rowE = logRows.filter({ hasText: '報告者E' });
  await expect(rowE).toContainText(/未提出|^$/);

  // 画面遷移・エラーなく全データが表示される。
  await expect(page.locator('.rm-heading h1')).toHaveText('日報確認・管理');
});
