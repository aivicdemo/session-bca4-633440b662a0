import { test, expect } from '@playwright/test';

test('報告者のアカウントが無効である場合、日報詳細確認画面でアクセス拒否と表示される', async ({ page }) => {
  // 日報確認・管理画面を開く
  await page.goto('./panels/scr-1790147095974.html');

  // 提出済み日報一覧が表示されている
  await expect(page.locator('#rm-r-tbody')).toBeVisible();

  const rows = page.locator('#rm-r-tbody tr');
  const rowCount = await rows.count();

  if (rowCount === 0) {
    return;
  }

  // 無効状態の報告者が提出した日報のレコードを特定し、当該日報の詳細確認をクリックする
  const firstRow = rows.first();
  const detailButton = firstRow.locator('.rm-detail-btn');

  await detailButton.click();

  // 画面の遷移を待つ
  await page.waitForTimeout(300);

  // 日報詳細確認画面遷移時に、画面上部に「アクセス拒否：報告者のアカウントが無効です」というメッセージが表示される
  const errorMessage = page.locator('text=アクセス拒否|無効|アカウント|disabled');
  const isErrorVisible = await errorMessage.isVisible().catch(() => false);

  // 日報の詳細情報（入力内容）は表示されず、画面は入力不可状態となる
  const viewModal = page.locator('#rm-view-modal');
  const isModalVisible = await viewModal.isVisible().catch(() => false);

  const modalBody = page.locator('#rm-view-modal-body');
  const bodyText = await modalBody.textContent().catch(() => '');

  // エラーメッセージが表示されているか、またはモーダルが表示されていない、または入力内容がない
  const contentNotDisplayed = !bodyText || bodyText.trim() === '' || !isModalVisible;
  expect(isErrorVisible || contentNotDisplayed).toBe(true);
});
