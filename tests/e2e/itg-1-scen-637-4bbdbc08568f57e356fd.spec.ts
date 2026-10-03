import { test, expect } from '@playwright/test';

test('日報の提出時刻が『HH:MM』形式で表示される', async ({ page }) => {
  // テスト環境にて、日報入力・提出画面で日報内容を入力し、妥当性チェックを経て提出ボタンを押下する
  await page.goto('/panels/scr-1790147087109.html');

  const textarea = page.locator('#rp-content');
  await textarea.fill('本日の業務内容：システム要件書の作成を実施し、顧客へ提出しました。');

  await expect(page.locator('#rp-validation')).toContainText(/入力OK|OK/);
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // 日報提出が完了し、システムが提出時刻を記録する
  await expect(page.locator('#rp-success')).toBeVisible();

  // 日報確認・管理画面を開く
  await page.goto('/panels/scr-1790147095974.html');

  // 提出済み日報の一覧から、ステップ2で提出した日報を検索・選択し、詳細表示を開く
  await page.locator('#rm-r-tbody tr').first().locator('.rm-detail-btn').click();
  await expect(page.locator('#rm-view-modal')).toBeVisible();

  // 日報詳細確認画面の『提出時刻』フィールドに表示されているテキストを確認する
  const modalBody = page.locator('#rm-view-modal-body');
  const bodyText = await modalBody.innerText();

  // 期待結果: 『HH:MM』形式（例：『09:45』『14:30』）で提出時刻が表示されていること
  // 秒単位は表示されず、時間と分のみが2桁ずつ、コロンで区切られた形式であること
  const timePattern = /(\d{2}):(\d{2})/;
  expect(bodyText).toMatch(timePattern);

  const timeMatch = bodyText.match(timePattern);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    expect(hours).toBeGreaterThanOrEqual(0);
    expect(hours).toBeLessThan(24);
    expect(minutes).toBeGreaterThanOrEqual(0);
    expect(minutes).toBeLessThan(60);
    // 秒が含まれていないことを確認
    expect(bodyText).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  }
});
