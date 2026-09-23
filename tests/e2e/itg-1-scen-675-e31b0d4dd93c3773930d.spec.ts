import { test, expect, type Page } from '@playwright/test';

// SCEN-675: リーダーが管理画面にアクセス可能な場合、メール送信履歴一覧が表示される。
//
// panels/scr-1790147095974.html（日報確認・管理画面）の「メール送信履歴」タブ（data-tab="mail"）は
// 実データテーブル（#rm-mail-tbody）を表示する。列見出しは「送信日時」「メールタイプ」「送信先」「件名」
// 「ステータス」であり、仕様の期待結果にある「送信対象ユーザー名」に一致する列名は存在しない（実装の
// 「送信先」列は送信先メールアドレスを表示しており、氏名は保持していない）。この用語の食い違いは
// .aivic/batches/17/unresolved.md に記録し、本テストでは「送信対象」を表す実在の列（送信先）で代替検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーが管理画面のメール送信履歴タブを開くと、送信日時・送信対象・メール種別・配信状態の列を持つ一覧が最新順に表示される', async ({
  page,
}) => {
  // リーダーロールを持つユーザーでシステムにログインする。
  await login(page, 'leader_scen675');

  // 日報確認・管理画面へ遷移する。
  await page.goto('/panels/scr-1790147095974.html');

  // 管理画面内の「メール送信履歴」タブを開く。
  await page.getByRole('button', { name: 'メール送信履歴' }).click();
  const mailPanel = page.locator('[data-panel="mail"]');
  await expect(mailPanel).toHaveClass(/is-active/);

  // メール送信履歴一覧が表示されるまで待機する。
  const tbody = page.locator('#rm-mail-tbody');
  const rows = tbody.locator('tr');
  await expect(rows.first()).toBeVisible();

  // (1)送信日時 (2)送信対象ユーザー名相当（実装上は送信先メールアドレス列） (3)メール種別 (4)配信状態
  // を含む列を持つデータテーブルであることを確認する。
  const headers = mailPanel.locator('table.rm-table thead th');
  await expect(headers).toHaveText(['送信日時', 'メールタイプ', '送信先', '件名', 'ステータス']);

  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 各行が送信日時・送信先・メール種別・配信状態を保持していることを確認する。
  for (let i = 0; i < rowCount; i++) {
    const cells = rows.nth(i).locator('td');
    await expect(cells.nth(0)).not.toHaveText('');
    await expect(cells.nth(1)).not.toHaveText('');
    await expect(cells.nth(2)).not.toHaveText('');
    await expect(cells.nth(4)).not.toHaveText('');
  }

  // 一覧は最新の送信記録から順に表示されることを確認する（送信日時列で降順）。
  const sentAtValues = await rows.locator('td:nth-child(1)').allTextContents();
  const sortedDesc = [...sentAtValues].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  expect(sentAtValues).toEqual(sortedDesc);

  // 一覧がスクロール可能な状態であることを確認する（一覧を含む領域が overflow-y: auto/scroll である）。
  const overflowY = await page.locator('.content-area').evaluate((el) => getComputedStyle(el).overflowY);
  expect(['auto', 'scroll']).toContain(overflowY);
});
