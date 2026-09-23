import { test, expect, type Page } from '@playwright/test';

// SCEN-629: チームにメンバーが登録されていない場合、エラーメッセージが表示される
//
// 前提条件「テスト用データベースを初期化し、チーム『営業部』を作成する（メンバー登録なし）」について、本システムの
// window.AIVIC_TABLES には「チーム」を管理する専用テーブルが存在せず（ユーザー・日報・日報リマインダー設定・
// 日報未提出者検知ログ・メール送信履歴のみ）、テスト用データベースを初期化したりチームを作成したりする管理UI・APIも
// 存在しない。また panels/scr-1790147095974.html の「画面上部のチーム選択ドロップダウン」に相当する要素はどのタブにも
// 存在せず（ui-reference.md の selectors にも該当の id/class はない）、リーダーがチームを選択して日報一覧を切り替える
// 機能は実装されていない。「提出済み日報」タブは常に固定のモック配列（reports）を表示するのみで、チームによる絞り込みは
// 行われない。したがって「選択したチームにメンバーが登録されていません」というエラーメッセージも実装されていない。
// 本テストは仕様の文言に忠実に、チーム選択ドロップダウンの存在と、選択後のエラーメッセージ表示・一覧の空表示・
// 操作継続可能性を検証する形で記述したが、上記の理由から現状のサンプル実装では成立しない可能性が高い。
// 詳細は .aivic/batches/7/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('チームにメンバーが登録されていない場合、エラーメッセージが表示される', async ({ page }) => {
  // テスト用ユーザーアカウントで日報管理システムにログインする
  await login(page, 'leader_scen629');

  // 「日報確認・管理画面」へ遷移する
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 画面上部のチーム選択ドロップダウンから「営業部」を選択する
  const teamSelect = page.getByRole('combobox', { name: /チーム/ });
  await expect(teamSelect).toBeVisible();
  await teamSelect.selectOption({ label: '営業部' });

  // 「提出済み日報一覧」タブ または 同等の提出済み日報表示領域を表示する
  const reportsTab = page.locator('.rm-tab[data-tab="reports"]');
  await reportsTab.click();
  await expect(reportsTab).toHaveClass(/is-active/);

  // エラーメッセージ「選択したチームにメンバーが登録されていません」が画面上に表示される
  await expect(page.getByText('選択したチームにメンバーが登録されていません')).toBeVisible();

  // 一覧データは空の状態で表示される
  await expect(page.locator('#rm-r-tbody tr')).toHaveCount(1);
  await expect(page.locator('#rm-r-tbody')).toContainText('該当する日報がありません');

  // ユーザーは操作を続行できる状態のまま保たれている（致命的エラーで画面が遷移・ブロックされない）
  await expect(page.locator('.rm-tabs')).toBeVisible();
  const missingTab = page.locator('.rm-tab[data-tab="reminder"]');
  await missingTab.click();
  await expect(missingTab).toHaveClass(/is-active/);
});
