import { test, expect, type Page } from '@playwright/test';

// SCEN-634: 報告者がリーダーの管理チームに所属していない場合、日報詳細確認画面でアクセス拒否と表示される
//
// window.AIVIC_TABLES にはユーザー・日報・日報リマインダー設定・日報未提出者検知ログ・メール送信履歴の5テーブルのみが
// 定義されており、「チーム」という概念を持つテーブルは存在しない（過去のバッチ7 SCEN-629 でも同様の指摘あり）。
// 「テスト用ユーザーAを報告者として準備する」「テスト用ユーザーBをリーダーとして準備し、管理チームを作成する」という
// 前提操作を行うための管理UI・APIも存在しない。また panels/scr-1790147095974.html の詳細確認ボタン
// （.rm-detail-btn）押下時の openViewModal 処理は、クリックしたユーザー（リーダー）とその日報の報告者が
// 同一チームに所属しているかの検証を一切行わない。したがって「このユーザーの日報にアクセスする権限がありません」に
// 相当するメッセージは画面上に実装されていない。本テストはユーザーBとしてログインし、一覧の先頭行（ユーザーAが
// 提出した日報の代替）の詳細確認をクリックする操作で仕様の期待結果の文言に忠実な検証を記述したが、現状の
// サンプル実装では成立しない可能性が高い。詳細は .aivic/batches/9/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者がリーダーの管理チームに所属していない場合、日報詳細確認画面でアクセス拒否と表示される', async ({ page }) => {
  // ユーザーBで日報確認・管理画面にログインする
  await login(page, 'leader_b_scen634');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const reportsTab = page.locator('.rm-tab[data-tab="reports"]');
  await expect(reportsTab).toHaveClass(/is-active/);

  const rowsBefore = await page.locator('#rm-r-tbody tr').count();

  // 日報確認・管理画面上で、ユーザーAが提出した日報の詳細を確認しようとするURLまたはリンクにアクセスする
  // （管理チームに未所属のユーザーAを一覧から識別する手段が画面上にないため、一覧の先頭行を代替として使用する）
  const targetRow = page.locator('#rm-r-tbody tr').first();
  await expect(targetRow).toBeVisible();

  // 日報詳細確認画面への遷移を試みる
  await targetRow.locator('.rm-detail-btn').click();

  // 日報詳細確認画面は表示されず、アクセス拒否メッセージが画面に表示される
  await expect(page.getByText('このユーザーの日報にアクセスする権限がありません')).toBeVisible();

  // ユーザーは日報確認・管理画面にとどまるか、アクセス拒否専用の画面へ遷移する
  await expect(page).toHaveURL(/panels\/scr-1790147095974\.html/);
  const rowsAfter = await page.locator('#rm-r-tbody tr').count();
  expect(rowsAfter).toBe(rowsBefore);
});
