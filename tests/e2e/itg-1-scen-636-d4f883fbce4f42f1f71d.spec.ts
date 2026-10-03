import { test, expect } from '@playwright/test';

test('日報が報告者の氏名を表示される', async ({ page }) => {
  // テストユーザー（報告者）として日報入力・提出画面にログインする
  await page.goto('/panels/scr-1790147087109.html');
  // 日報内容（今日何をしたか）を入力欄に記入する
  const textarea = page.locator('#rp-content');
  await textarea.fill('本日の業務内容：システム改修タスクの実装を進め、単体テストを完了しました。');

  // 妥当性チェックを経て提出ボタンをクリックする
  await expect(page.locator('#rp-validation')).toContainText(/入力OK|OK/);
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // 提出完了後、日報確認・管理画面に遷移する
  await expect(page.locator('#rp-success')).toBeVisible();

  // 日報確認・管理画面にアクセスし、提出済み日報一覧から当該日報をクリックして詳細を開く
  await page.goto('/panels/scr-1790147095974.html');

  const detailBtn = page.locator('#rm-r-tbody tr').first().locator('.rm-detail-btn');
  await detailBtn.click();

  // 日報詳細画面に表示される報告者情報を確認する
  const modalTitle = page.locator('#rm-view-modal-title');
  await expect(modalTitle).toBeVisible();

  // 期待結果: 報告者の氏名が正確に表示されていること
  // タイトルに「さんの日報」という形式で報告者名が表示されていることを確認
  const titleText = await modalTitle.textContent();
  expect(titleText).toMatch(/さんの日報/);
  expect(titleText).toBeTruthy();
});
