import { test, expect, type Page } from '@playwright/test';

// SCEN-628: 集計対象日が未来の日付である場合、エラーメッセージが表示される
//
// panels/scr-1790147095974.html の「提出済み日報」タブには、単一の「集計対象日」という入力フィールドは存在せず、
// 報告日で絞り込むための「開始日」（#rm-r-from）・「終了日」（#rm-r-to）という2つの日付フィルターが存在する。
// 本テストでは、単一日付として扱いうる #rm-r-from を「集計対象日の入力フィールド」の代替として使用する。
// また、「フィルター実行ボタン」に相当する要素も存在せず、フィルターは input イベントで即時反映される実装のため、
// 値入力後に input イベントを発火させることで「確定またはフィルター実行」操作を代替した。
// なお、この画面の日付フィルターには未来日付を拒否するバリデーションが実装されておらず、対応するエラーメッセージ
// 要素も存在しない。詳細は .aivic/batches/7/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('集計対象日が未来の日付である場合、エラーメッセージが表示される', async ({ page }) => {
  // 日報確認・管理画面にログインする
  await login(page, 'leader_scen628');

  // 提出済み日報一覧表示機能にアクセスする（「日報確認・管理画面」の「提出済み日報」タブ。既定で表示される）
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const reportsTab = page.locator('.rm-tab[data-tab="reports"]');
  await expect(reportsTab).toHaveClass(/is-active/);

  const rowsBefore = await page.locator('#rm-r-tbody tr').count();

  // 集計対象日の入力フィールドに、本日より未来の日付（例：明日の日付）を入力する
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const targetDateField = page.locator('#rm-r-from');
  await targetDateField.fill(tomorrowStr);

  // 集計対象日フィールドで確定またはフィルター実行ボタンを押す
  await targetDateField.dispatchEvent('input');
  await targetDateField.blur();

  // 画面上に「集計対象日は本日以前の日付を指定してください」というエラーメッセージが表示される
  await expect(page.getByText('集計対象日は本日以前の日付を指定してください')).toBeVisible();

  // 入力フィールドは未来日付のまま保持される
  await expect(targetDateField).toHaveValue(tomorrowStr);

  // 提出済み日報一覧の再読み込みは発生しない（表示行数が変化しない）
  const rowsAfter = await page.locator('#rm-r-tbody tr').count();
  expect(rowsAfter).toBe(rowsBefore);
});
