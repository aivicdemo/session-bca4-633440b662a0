import { test, expect, type Page } from '@playwright/test';

// SCEN-683: 管理画面から選択された未提出者の一覧と対象者の詳細情報が取得される。
//
// panels/scr-1790147095974.html の未提出者一覧（#rm-missing-tbody）は チェックボックス・報告者名・対象日付・
// 最終リマインダー送信日時 の4列のみで構成されており、選択した対象者の氏名・ユーザーID・所属部門・直近未提出
// 日時を表示する「詳細情報パネル」は存在しない。また複数選択時に「選択中: N件」と表示する仕組みも実装されて
// いない。本テストは仕様の期待結果の文言（詳細情報パネルの表示項目、選択中件数表示）どおりに検証を記述したが、
// 現状のサンプル実装では該当要素が存在しないため成立しない可能性が高い。詳細は .aivic/batches/19/unresolved.md
// を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('未提出者一覧から対象者を選択すると詳細情報パネルと選択中件数が更新される', async ({ page }) => {
  // 日報確認・管理画面にログインし、管理者権限で画面を開く
  await login(page, 'admin_scen683');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 画面上の「未提出者一覧」セクションを表示する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);
  await expect(rows.first()).toBeVisible();

  // 未提出者一覧から1名以上の対象者をチェックボックスで選択する
  const firstRow = rows.first();
  const firstRowName = (await firstRow.locator('td').nth(1).textContent())?.trim() ?? '';
  await firstRow.locator('.rm-missing-checkbox').check();

  // 選択された対象者の詳細情報パネル（氏名、ユーザーID、所属、未提出日数など）が画面右側または下部に
  // 表示されることを確認する
  const detailPanel = page.locator('[data-testid="missing-detail-panel"]');
  await expect(detailPanel).toBeVisible();
  await expect(detailPanel).toContainText(firstRowName);
  await expect(detailPanel).toContainText('ユーザーID');
  await expect(detailPanel).toContainText('所属');
  await expect(detailPanel).toContainText('未提出日数');

  // 選択を別の対象者に変更し、詳細情報パネルが即座に更新されることを確認する
  const rowCount = await rows.count();
  if (rowCount > 1) {
    await firstRow.locator('.rm-missing-checkbox').uncheck();
    const secondRow = rows.nth(1);
    const secondRowName = (await secondRow.locator('td').nth(1).textContent())?.trim() ?? '';
    await secondRow.locator('.rm-missing-checkbox').check();
    await expect(detailPanel).toContainText(secondRowName);
  }

  // 複数名を同時選択し、一覧に「選択中: N件」と表示されることを確認する
  await firstRow.locator('.rm-missing-checkbox').check();
  const selectedCountText = page.getByText(/選択中:\s*\d+件/);
  await expect(selectedCountText).toBeVisible();
  await expect(selectedCountText).toContainText('選択中: 2件');
});
