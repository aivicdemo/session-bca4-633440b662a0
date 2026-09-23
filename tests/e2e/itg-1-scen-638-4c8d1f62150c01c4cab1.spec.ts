import { test, expect, type Page } from '@playwright/test';

// SCEN-638: 日報の報告内容が改行・特殊文字を保持したまま表示される
//
// panels/scr-1790147095974.html の「提出済み日報」タブ（#rm-r-tbody）は window.AIVIC_PAGE_INIT_JS 内に
// ハードコードされた固定配列（reports）を表示するのみで、window.AIVIC_API_URL の「日報」テーブルを参照
// していない（.aivic/batches/1/unresolved.md に同種の記録がある）。そのため、
// panels/scr-1790147087109.html から新たに提出した内容は、この管理画面の一覧・詳細のいずれにも反映されない。
// 本テストは、仕様の期待結果を弱めずに、実際に提出した内容（改行2行・特殊文字 &, <, >, 「」を含む）が
// 一覧から見つかり、詳細表示でその改行・特殊文字が保持されていることをそのまま検証する。詳細は
// unresolved.md を参照。

const REPORT_CONTENT = '本日の業務:\n・システム改修 > DB設計\n・資料作成「進捗報告書」&レビュー';

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報の報告内容が改行・特殊文字を保持したまま表示される', async ({ page }) => {
  await login(page, 'reporter_scen638');

  // 手順1-3: テスト用の日報データ（改行2行・特殊文字を含む）を準備し、日報入力・提出画面の報告内容入力欄に貼り付ける
  const textarea = page.locator('#rp-content');
  await textarea.fill(REPORT_CONTENT);
  await expect(textarea).toHaveValue(REPORT_CONTENT);

  // 手順4: 妥当性チェック（バリデーション）を実行する
  const validation = page.locator('#rp-validation');
  await expect(validation).toHaveText(/入力OK/);
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeEnabled();

  // 手順5: チェック完了後、提出ボタンを押下する
  await submitBtn.click();
  await expect(page.locator('#rp-success')).toBeVisible({ timeout: 5000 });

  // 手順6: 日報確認・管理画面へ遷移する
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順7: 提出済みの日報詳細を開く（一覧から該当日報を選択、詳細表示）
  await page.locator('#rm-r-keyword').fill('システム改修');
  const targetRow = page.locator('#rm-r-tbody tr', { hasText: 'システム改修' }).first();
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-detail-btn').click();

  const modalBody = page.locator('#rm-view-modal-body');
  await expect(page.locator('#rm-view-modal')).toHaveClass(/is-visible/);

  // 手順8: 画面上に表示された報告内容テキストをスクリーンショット取得し、
  // locator.innerHTML で改行・特殊文字の保存形式を確認する
  await page.screenshot({ path: 'test-results/scen-638-detail.png' });
  const bodyHtml = await modalBody.innerHTML();
  const contentDd = modalBody.locator('dd').first();
  const contentText = await contentDd.textContent();

  // 期待結果(1): 改行がそのまま保持され、2行として視認できる
  expect((contentText ?? '').split('\n').length).toBeGreaterThanOrEqual(2);
  await expect(contentDd).toHaveCSS('white-space', 'pre-wrap');

  // 期待結果(2): 特殊文字（&, <, >, 「」）がHTMLエスケープまたはテキストノードとして正しく処理され、
  // 元の入力値そのものが表示に反映される
  expect(contentText ?? '').toContain('「進捗報告書」');
  expect(contentText ?? '').toContain('> DB設計');
  expect(contentText ?? '').toContain('&レビュー');
  expect(bodyHtml).not.toMatch(/<DB設計|<レビュー/);
  expect(bodyHtml).toMatch(/&amp;/);
  expect(bodyHtml).toMatch(/&gt;/);

  // 期待結果(3): テキストの破損・文字化け・タグ注入による予期しない装飾変更が生じない
  expect(bodyHtml).not.toContain('<script');
  expect(contentText ?? '').not.toContain('�');
});
