import { test, expect, type Page } from '@playwright/test';

// SCEN-648: 管理画面にアクセスしたとき、提出済み・未提出者一覧、検知ステータス、催促状況を含むダッシュボード
// データが取得され表示される。
//
// panels/scr-1790147095974.html には、①提出済み者一覧・②未提出者一覧・③検知ステータス・④催促状況の4要素が
// 1つの「ダッシュボード領域」として統合表示されているわけではなく、タブ切り替え式の別パネル（提出済み日報／
// 未提出者・リマインダー／検知ログ／メール送信履歴）に分かれている（daily-report-management-view.ts の
// retrieveLeaderDashboardData に対応する統合ビューは画面側に実装されていない）。
// ③検知ステータスの実際の表示文言は #rm-detect-status の「最終検知: 2026-09-23 09:00」であり、仕様が期待する
// 「定時自動検知：実行済み」「定時自動検知完了」という文言そのものは表示されない。
// ④催促状況について、実際の画面には「送信済み：X件」「配信成功：Y件」「配信失敗：Z件」のような集計件数表示は
// 存在せず、メール送信履歴タブに個別レコード（送信日時・メールタイプ・送信先・件名・ステータス）が列挙される
// のみである。これらの食い違いは .aivic/batches/11/unresolved.md に記録する。本テストは仕様の期待結果の文言に
// 忠実に、これらの表示を検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('管理画面のダッシュボード領域に提出済み・未提出・検知ステータス・催促状況が表示される', async ({ page }) => {
  // テストユーザー（管理者）でブラウザにログインする。
  await login(page, 'admin_scen648');

  // 日報確認・管理画面へ遷移する。
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 画面読み込み完了を待つ。
  await expect(page.locator('.rm-heading h1')).toHaveText('日報確認・管理');

  // ①提出済み者一覧に本日提出したユーザーが表示されていることを確認する。
  const reportRows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  await expect(reportRows.first()).toBeVisible();

  // ②未提出者一覧に本日未提出のユーザーが表示されていることを確認する。
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  const missingRows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(missingRows.first()).toBeVisible();

  // ③検知ステータス表示に「定時自動検知：実行済み」または同等のステータス値、最終実行時刻が表示される。
  const detectStatus = page.locator('#rm-detect-status');
  await expect(detectStatus).toContainText('定時自動検知完了');
  await expect(detectStatus).toContainText(/\d{4}-\d{2}-\d{2}/);

  // ④催促状況表示にメール送信履歴の件数・配信状態が表示されていることを確認する。
  await page.locator('.rm-tab[data-tab="mail"]').click();
  await expect(page.getByText(/送信済み：\d+件/)).toBeVisible();
  await expect(page.getByText(/配信成功：\d+件/)).toBeVisible();
  await expect(page.getByText(/配信失敗：\d+件/)).toBeVisible();
});
