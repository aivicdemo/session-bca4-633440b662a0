import { test, expect, type Page } from '@playwright/test';

// SCEN-632: 報告者がユーザーマスタに登録されていない場合、日報詳細確認画面でアクセス拒否と表示される
//
// panels/scr-1790147095974.html の「提出済み日報」タブに表示される一覧（reports）は AIVIC_PAGE_INIT_JS 内に
// ハードコードされた固定のモック配列であり、window.AIVIC_PRESET_SEED の「ユーザー」テーブル（ユーザーマスタ）とは
// 一切連携していない。したがって「報告者がユーザーマスタに未登録である日報」を一覧から特定する手段は画面上に存在せず、
// 詳細確認ボタン（.rm-detail-btn）をクリックした際の処理（openViewModal）もユーザーマスタとの照合を行わずに
// 常にモーダル（#rm-view-modal）を表示するのみである。「アクセス拒否」という文言や、それに相当するメッセージ表示は
// この画面のどこにも実装されていない。本テストは一覧の先頭行（報告者がユーザーマスタと紐付いていない、という意味では
// 一覧の全行が該当する）を「報告者がユーザーマスタに未登録である日報」の代替として選択し、仕様の期待結果の文言に
// 忠実な検証を記述したが、現状のサンプル実装では成立しない可能性が高い。詳細は .aivic/batches/9/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者がユーザーマスタに登録されていない場合、日報詳細確認画面でアクセス拒否と表示される', async ({ page }) => {
  // 日報確認・管理画面にアクセスする
  await login(page, 'leader_scen632');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const reportsTab = page.locator('.rm-tab[data-tab="reports"]');
  await expect(reportsTab).toHaveClass(/is-active/);

  // 提出済み日報の一覧から、報告者がユーザーマスタに未登録である日報を選択し、詳細確認ボタンをクリックする
  const targetRow = page.locator('#rm-r-tbody tr').first();
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-detail-btn').click();

  // 画面の遷移を待つ
  await page.waitForTimeout(300);

  // 日報詳細確認画面が表示されず、画面上に「アクセス拒否」またはそれに相当するエラーメッセージが表示される
  await expect(page.getByText(/アクセス拒否/)).toBeVisible();

  // ユーザーマスタに登録されていない報告者の日報内容（入力項目を含む）は一切表示されない
  await expect(page.locator('#rm-view-modal-body')).not.toBeVisible();
});
