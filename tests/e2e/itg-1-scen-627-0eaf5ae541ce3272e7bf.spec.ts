import { test, expect, type Page } from '@playwright/test';

// SCEN-627: 未提出の報告者は一覧に表示されるが、内容と送信時刻は空欄である。
//
// panels/scr-1790147095974.html の「未提出者・リマインダー」タブ（#rm-missing-tbody）の列は、チェックボックス・
// 報告者名・対象日付・最終リマインダー送信日時の4列のみであり、「内容」列・「送信時刻」列という名称の列自体が
// 存在しない（ui-reference.md の visibleTexts にも該当ヘッダーは含まれていない）。また表示件数も
// window.AIVIC_PAGE_INIT_JS 内にハードコードされたモック配列（missing、3件）のみであり、「本日の報告予定
// ユーザー5人全員」を表す仕組みも存在しない。加えて、日報確認・管理画面へのアクセスはリーダー権限を前提とする
// 設計（.aivic/batches/5/unresolved.md の SCEN-624 参照）だが、本仕様の手順は「テストユーザー（報告者）で
// ログイン」した上で同画面を開くとしており、前提となるユーザー種別が食い違っている。サンプル実装には権限判定
// 自体が存在しないため、ログインとログイン後の画面遷移そのものは成立する。本テストは、仕様の期待結果の文言
// どおり「内容」「送信時刻」という列見出しの存在と5件全員表示、および該当セルの空欄をそのまま検証する。
// 詳細は unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('未提出の報告者は一覧に表示されるが、内容と送信時刻は空欄である', async ({ page }) => {
  // テストユーザー（報告者）でログインし、日報確認・管理画面を開く
  await login(page, 'reporter_scen627');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 定時自動検知により未提出者一覧が表示されるまで待機、または管理画面の未提出者一覧セクションを確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();

  // 未提出者一覧の表に、本日の報告予定ユーザー5人の全員が表示されていることを確認する
  const rowCount = await rows.count();
  expect(rowCount).toBe(5);

  // 未提出者一覧に『内容』列と『送信時刻』列が存在することを確認する
  const headerCells = page.locator('[data-panel="reminder"] table thead th');
  const headerTexts = await headerCells.allTextContents();
  const contentIndex = headerTexts.indexOf('内容');
  const sentAtIndex = headerTexts.indexOf('送信時刻');
  expect(contentIndex).toBeGreaterThanOrEqual(0);
  expect(sentAtIndex).toBeGreaterThanOrEqual(0);

  // 未提出者のうち1名の行を選択し、その行の『内容』列と『送信時刻』列のセルを確認する
  const firstRow = rows.first();
  const cells = firstRow.locator('td');
  await expect(cells.nth(contentIndex)).toBeEmpty();
  await expect(cells.nth(sentAtIndex)).toBeEmpty();
});
