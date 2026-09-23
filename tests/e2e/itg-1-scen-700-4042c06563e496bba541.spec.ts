import { test, expect, type Page } from '@playwright/test';

// SCEN-700: 連続未提出が2日目以上の未提出者に対して推奨アクションが「直接指示」と判定される
//
// panels/scr-1790147095974.html の「未提出者・リマインダー」タブ（#rm-missing-tbody）の行には
// 「詳細」ボタンや詳細情報パネルを開く手段が存在しない（「提出済み日報」タブ・「検知ログ」タブの行には
// #rm-view-modal を開く「詳細」ボタンがあるが、未提出者一覧の行にはない）。また missing 配列には
// 「連続未提出日数」に相当する項目がなく、「推奨アクション」フィールド自体も画面のどこにも存在しない。
// 本テストは仕様の文言に忠実に、既に一度リマインダーが送信済み（＝連続未提出2日目以上に相当すると
// 考えられる）の報告者「伊藤 三郎」の行を選択し、他タブと同様の詳細パネル（#rm-view-modal）を開いて
// 「推奨アクション」フィールドの値が「直接指示」であることを検証する形で記述したが、行に詳細ボタンが
// 存在せず、「推奨アクション」フィールドも実装されていないため、現状のサンプル実装では失敗する可能性が
// 高い。詳細は .aivic/batches/22/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('連続未提出が2日目以上の未提出者に対して推奨アクションが「直接指示」と判定される', async ({ page }) => {
  // テスト環境で日報確認・管理画面にログインする（管理者権限）
  await login(page, 'admin_scen700');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者リストを表示する
  const reminderTab = page.locator('.rm-tab[data-tab="reminder"]');
  await reminderTab.click();
  await expect(reminderTab).toHaveClass(/is-active/);
  const missingRows = page.locator('#rm-missing-tbody tr');
  await expect(missingRows).not.toHaveCount(0);

  // 連続未提出が2日目以上のユーザーA（例：昨日未提出、本日も未提出）が一覧に表示されていることを確認する
  // （既にリマインダーが一度送信済み＝2日目以上の未提出が継続していると考えられる報告者を対象とする）
  const userARow = missingRows.filter({ hasText: '伊藤 三郎' });
  await expect(userARow).toBeVisible();
  await expect(userARow).not.toContainText('未送信');

  // ユーザーAの行を選択し、詳細情報パネルを開く
  await userARow.getByRole('button', { name: '詳細' }).click();

  // 詳細パネル内の「推奨アクション」フィールドが表示されていることを確認する
  const detailPanel = page.locator('#rm-view-modal');
  await expect(detailPanel).toBeVisible();
  const detailBody = page.locator('#rm-view-modal-body');
  await expect(detailBody).toContainText('推奨アクション');

  // 「推奨アクション」フィールドの値を確認する
  // → ユーザーAの詳細パネルに表示される「推奨アクション」フィールドの値が「直接指示」である
  await expect(detailBody).toContainText('直接指示');
});
