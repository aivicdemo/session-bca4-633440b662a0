import { test, expect } from '@playwright/test';

test('リーダーが権限を持つ場合、日報詳細確認画面にアクセスでき、報告者の日報が統一フォーマットで表示される', async ({ page }) => {
  // テストユーザー（リーダー権限を持つユーザー）でシステムにログインする
  await page.goto('/login.html');
  const shell = page.locator('.shell');
  await expect(shell).toBeVisible();

  // サンプル画面を直接開く（ログイン情報は外部で管理）
  await page.goto('./panels/scr-1790147095974.html');

  // 日報確認・管理画面が表示されていることを確認
  await expect(page.locator('.rm-heading')).toBeVisible();

  // 提出済み日報タブが表示されている
  const tabs = page.locator('.rm-tab');
  const firstTab = tabs.first();
  await expect(firstTab).toBeVisible();

  // 提出済み日報一覧のテーブルが表示されている
  const reportTbody = page.locator('#rm-r-tbody');
  await expect(reportTbody).toBeVisible();

  const rows = page.locator('#rm-r-tbody tr');
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 提出済み日報の一覧から、報告者が提出した日報を1件選択する
  const firstRow = rows.first();
  const reporterName = await firstRow.locator('td').nth(0).textContent();
  const reportDate = await firstRow.locator('td').nth(1).textContent();

  const detailButton = firstRow.locator('.rm-detail-btn');
  await expect(detailButton).toBeVisible();
  await detailButton.click();

  // 日報詳細確認画面が開かれたことを確認する
  const viewModal = page.locator('#rm-view-modal');
  await expect(viewModal).toBeVisible();

  // 画面に表示されている日報内容（「今日何をしたか」の入力値）が、統一フォーマット（日付、報告者名、入力内容）で表示される
  const modalTitle = page.locator('#rm-view-modal-title');
  const modalBody = page.locator('#rm-view-modal-body');

  // タイトルに【報告者名】【日付】が含まれている
  const titleText = await modalTitle.textContent();
  expect(titleText).toContain(reporterName?.trim());
  expect(titleText).toContain(reportDate?.trim());
  expect(titleText).toContain('さんの日報');

  // 本文に【入力内容（「今日何をしたか」の記述）】が表示されている
  await expect(modalBody).toContainText('業務内容');

  // 他の報告者の日報でも同じ形式であることを確認
  const closeButton = page.locator('#rm-view-modal-close');
  await closeButton.click();
  await expect(viewModal).not.toBeVisible();

  // 2件目の日報があれば、同じ形式で表示されることを確認
  if (rowCount > 1) {
    const secondRow = rows.nth(1);
    const secondReporterName = await secondRow.locator('td').nth(0).textContent();
    const secondReportDate = await secondRow.locator('td').nth(1).textContent();

    const secondDetailButton = secondRow.locator('.rm-detail-btn');
    await secondDetailButton.click();

    await expect(viewModal).toBeVisible();
    const secondTitleText = await modalTitle.textContent();
    expect(secondTitleText).toContain(secondReporterName?.trim());
    expect(secondTitleText).toContain(secondReportDate?.trim());
    expect(secondTitleText).toContain('さんの日報');
  }
});
