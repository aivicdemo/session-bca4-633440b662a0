import { test, expect, type Page } from '@playwright/test';

// SCEN-630: リーダーが権限を持つ場合、日報詳細確認画面にアクセスでき、報告者の日報が統一フォーマットで表示される
//
// panels/scr-1790147095974.html には「日報詳細確認画面」という独立ページは存在せず、「提出済み日報」タブの
// 一覧から「詳細」ボタン（.rm-detail-btn / data-report-id）を押すとモーダル（#rm-view-modal）が開き、
// タイトルに「{報告者名} さんの日報（{報告日}）」、本文の <dt>業務内容</dt><dd>{入力内容}</dd> にあたる部分に
// 「今日何をしたか」に相当する入力内容が表示される。このモーダルを「日報詳細確認画面」として扱い、統一フォーマット
// （日付・報告者名・入力内容）で表示されること、および他の報告者の日報でも同じ形式であることを検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーが権限を持つ場合、日報詳細確認画面にアクセスでき、報告者の日報が統一フォーマットで表示される', async ({ page }) => {
  // テストユーザー（リーダー権限を持つユーザー）でシステムにログインする
  await login(page, 'leader_scen630');

  // 日報確認・管理画面を開く
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const reportsTab = page.locator('.rm-tab[data-tab="reports"]');
  await expect(reportsTab).toHaveClass(/is-active/);

  const rows = page.locator('#rm-r-tbody tr');
  await expect(rows.first()).toBeVisible();

  const viewModal = page.locator('#rm-view-modal');
  const modalTitle = page.locator('#rm-view-modal-title');
  const modalBody = page.locator('#rm-view-modal-body');

  async function verifyDetailFormat(rowIndex: number) {
    const row = rows.nth(rowIndex);
    const reporterName = (await row.locator('td').nth(0).innerText()).trim();
    const reportDate = (await row.locator('td').nth(1).innerText()).trim();
    const contentPreview = (await row.locator('td').nth(2).innerText()).trim().replace(/…$/, '');

    // 提出済み日報の一覧から、報告者が提出した日報を1件選択する
    await row.locator('.rm-detail-btn').click();

    // 日報詳細確認画面（詳細モーダル）が開かれたことを確認する
    await expect(viewModal).toHaveClass(/is-visible/);

    // 【日付】【報告者名】【入力内容】の統一フォーマットで表示されていることを確認する
    await expect(modalTitle).toContainText(reporterName);
    await expect(modalTitle).toContainText(reportDate);
    await expect(modalTitle).toContainText('さんの日報');

    await expect(modalBody).toContainText('業務内容');
    await expect(modalBody).toContainText(contentPreview);
    await expect(modalBody).toContainText('提出日時');

    await page.locator('#rm-view-modal-close').click();
    await expect(viewModal).not.toHaveClass(/is-visible/);
  }

  // 1件目の報告者の日報詳細を統一フォーマットで確認する
  await verifyDetailFormat(0);

  // 画面レイアウトは他の報告者の日報と同じ形式で統一されていることを、別の報告者でも確認する
  const rowCount = await rows.count();
  if (rowCount > 1) {
    await verifyDetailFormat(1);
  }
});
