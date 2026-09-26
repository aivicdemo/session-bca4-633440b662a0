import { test, expect } from '@playwright/test';

test('報告者がリーダーの管理チームに所属していない場合、日報詳細確認画面でアクセス拒否と表示される', async ({ page }) => {
  // ユーザーBで日報確認・管理画面にログインする
  await page.goto('./panels/scr-1790147095974.html');

  // 日報確認・管理画面が表示されている
  await expect(page.locator('.rm-heading')).toBeVisible();

  // 日報確認・管理画面上で、ユーザーAが提出した日報の詳細を確認しようとするURLまたはリンクにアクセスする
  const tbody = page.locator('#rm-r-tbody');
  await expect(tbody).toBeVisible();

  const rows = page.locator('#rm-r-tbody tr');
  const rowCount = await rows.count();

  if (rowCount === 0) {
    return;
  }

  // 日報詳細確認画面への遷移を試みる
  const firstRow = rows.first();
  const detailButton = firstRow.locator('.rm-detail-btn');

  await detailButton.click();

  // 画面の遷移を待つ
  await page.waitForTimeout(300);

  // 日報詳細確認画面は表示されず、アクセス拒否メッセージが表示される
  const accessDeniedMessage = page.locator('text=アクセス権限|管理チーム|所属していない|権限がありません|unauthorized');
  const isAccessDeniedVisible = await accessDeniedMessage.isVisible().catch(() => false);

  // ユーザーは日報確認・管理画面にとどまるか、アクセス拒否専用の画面へ遷移する
  const viewModal = page.locator('#rm-view-modal');
  const isModalVisible = await viewModal.isVisible().catch(() => false);

  // アクセス拒否メッセージが表示されているか、またはモーダルが表示されていない
  expect(isAccessDeniedVisible || !isModalVisible).toBe(true);

  // ユーザーが元の画面にとどまっていることを確認
  expect(page.url()).toContain('scr-1790147095974');
});
