import { test, expect, type Page } from '@playwright/test';

// SCEN-669: 日報データベースが一時的に取得できない場合、検知ログ画面に
// 「日報データを取得できません。しばらく待ってから再度確認してください」警告メッセージが表示される。
//
// panels/scr-1790147095974.html の「検知ログ」タブ（#rm-log-tbody）は AIVIC_PAGE_INIT_JS 内にハードコードされた
// 固定配列（logs）を renderLogs() でそのまま描画するだけであり、window.AIVIC_API_URL への通信状況（成功/失敗）を
// 一切参照しない。したがって API へのリクエストを強制的に失敗させても、検知ログ一覧の表示内容・エラーメッセージ
// 表示には何の影響も出ない。また ui-reference.md の buttonTexts / visibleTexts にも「日報データを取得できません。
// しばらく待ってから再度確認してください」に相当する文言、および検知ログ専用の「検索・更新ボタン」に相当する
// UI要素は含まれていない（検知ログタブにはフィルターや更新ボタンが存在せず、タブ切替時に一度描画されるのみ）。
// 本テストでは「検索・更新ボタンを操作してログデータ取得をトリガーする」手順の代替として、API 通信を遮断した
// 状態でページを再読み込みしてタブを開き直す操作を用いた。詳細は .aivic/batches/16/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報データベースが一時的に取得できない場合、検知ログ画面に警告メッセージが表示される', async ({ page }) => {
  // 日報データベースが一時的に取得できない状態を模擬するため、バックエンドAPIへの通信を遮断する
  await page.route('**/api/**', (route) => route.abort());

  // テスト環境で日報確認・管理画面にアクセスし、ログイン完了状態とする
  await login(page, 'leader_scen669');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 検知ログ確認機能へ遷移する
  await page.locator('.rm-tab[data-tab="log"]').click();
  const existingRows = await page.locator('#rm-log-tbody tr:not(.rm-empty-row)').count();

  // 検知ログ画面の検索・更新ボタンを操作し、ログデータ取得をトリガーする
  // （画面には専用の検索・更新ボタンが存在しないため、データ再取得の代替操作として画面を再読み込みする）
  await page.reload();
  await page.locator('.rm-tab[data-tab="log"]').click();

  // 日報データベースが一時的に取得できない状態で、画面に表示されるメッセージを確認する
  await expect(
    page.getByText('日報データを取得できません。しばらく待ってから再度確認してください'),
  ).toBeVisible();

  // 既存のログデータ（あれば）は残存したまま表示されるか、またはログ一覧エリアが空白のまま警告メッセージのみが表示される
  const rowsAfter = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  const rowCountAfter = await rowsAfter.count();
  expect(rowCountAfter === existingRows || rowCountAfter === 0).toBe(true);
});
