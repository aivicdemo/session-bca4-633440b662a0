import { test, expect, type Page } from '@playwright/test';

// SCEN-659: 本日の日報がすべての報告者から提出されているとき、管理画面に未提出者一覧が表示されない。
//
// panels/scr-1790147087109.html（日報入力・提出画面）で日報を提出しても、panels/scr-1790147095974.html の
// 未提出者一覧（#rm-missing-tbody）はその提出結果を反映しない。未提出者一覧は window.AIVIC_PAGE_INIT_JS 内で
// missing という配列にハードコードされた3件（高橋次郎・伊藤三郎・渡辺恵子、対象日付は常に2026-09-23）を表示する
// だけであり、実際の日報提出データ（reports 配列や日報テーブル）とは連動していない。したがって「ユーザーマスタに
// 登録されている5人の報告者すべてが本日の日報を提出済みである」状態を画面操作のみで再現することはできない
// （そもそもユーザーマスタから報告者を確認・提出状況を突合する管理UIも存在しない）。renderMissing() 関数自体には
// missing.length === 0 の場合に「未提出者はいません」と表示する分岐が実装済みであるが、missing 配列を空にする
// 手段が画面上に存在しないため、この分岐へ到達できない。本テストは、5人の報告者が日報を提出したことを画面上で
// 確認できる範囲まで代替した上で、期待結果の文言どおり未提出者一覧が空になることを検証したが、現状のサンプル
// 実装では成立しない可能性が高い。詳細は .aivic/batches/13/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('全報告者が本日の日報を提出済みのとき、未提出者一覧セクションが表示されない', async ({ page }) => {
  // 日報確認・管理画面にアクセスする管理者アカウントでログインする
  await login(page, 'admin_scen659');

  // ユーザーマスタに登録されている5人の報告者すべてが、本日の日報を日報入力・提出画面から提出済みであることを
  // 事前に確認する（画面上でユーザー一覧に対応する操作がないため、代替として本アカウントで日報を提出する）
  await page.locator('#rp-content').fill('本日の業務内容（SCEN-659用のダミー提出）');
  await page.locator('#rp-submit-btn').click({ force: true });
  await expect(page.locator('#rp-success')).toBeVisible();

  // 日報確認・管理画面を表示する
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 画面上の『未提出者一覧』セクションまたはウィジェットの表示状態を確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();

  // 『未提出者一覧』セクションが表示されない、または『未提出者なし』のメッセージが表示され、未提出者のリストが
  // 空であることが画面上に反映される
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).toHaveCount(0);
  await expect(page.locator('#rm-missing-tbody')).toContainText('未提出者はいません');
});
