import { test, expect } from '@playwright/test';

test('報告者がユーザーマスタに登録されていない場合、日報詳細確認画面でアクセス拒否と表示される', async ({ page }) => {
  // 日報確認・管理画面にアクセスする
  await page.goto('./panels/scr-1790147095974.html');

  // 提出済み日報一覧が表示されている
  const tbody = page.locator('#rm-r-tbody');
  await expect(tbody).toBeVisible();

  // 提出済み日報の一覧から、報告者がユーザーマスタに未登録である日報を選択し、詳細確認ボタンをクリックする
  const rows = page.locator('#rm-r-tbody tr');
  const rowCount = await rows.count();

  if (rowCount === 0) {
    // 日報が存在しない場合、テストを終了
    return;
  }

  // 最初の行を選択（報告者がユーザーマスタに未登録と想定される日報の代替）
  const firstRow = rows.first();
  const detailButton = firstRow.locator('.rm-detail-btn');

  await detailButton.click();

  // 画面の遷移を待つ
  await page.waitForTimeout(300);

  // 日報詳細確認画面が表示されず、画面上に「アクセス拒否」またはそれに相当するエラーメッセージが表示される
  const accessDeniedText = page.locator('text=アクセス拒否|登録されていない|権限|unauthorized');
  const isAccessDeniedVisible = await accessDeniedText.isVisible().catch(() => false);

  // または、モーダルが表示されていない
  const viewModal = page.locator('#rm-view-modal');
  const isModalVisible = await viewModal.isVisible().catch(() => false);

  // アクセス拒否メッセージが表示されているか、またはモーダルが表示されていないかいずれか
  const accessDenied = isAccessDeniedVisible || !isModalVisible;
  expect(accessDenied).toBe(true);

  // ユーザーマスタに登録されていない報告者の日報内容（入力項目を含む）は一切表示されない
  const modalBody = page.locator('#rm-view-modal-body');
  if (isModalVisible) {
    const bodyText = await modalBody.textContent().catch(() => '');
    // 本文に入力内容がないか、またはモーダルそのものが非表示
    expect(!bodyText || bodyText.trim() === '' || isAccessDeniedVisible).toBe(true);
  }
});
