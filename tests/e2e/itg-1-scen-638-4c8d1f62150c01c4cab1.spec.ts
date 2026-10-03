import { test, expect } from '@playwright/test';

const REPORT_CONTENT = '本日の業務:\n・システム改修 > DB設計\n・資料作成「進捗報告書」&レビュー';

test('日報の報告内容が改行・特殊文字を保持したまま表示される', async ({ page }) => {
  // テスト用の日報データを準備する。報告内容に改行（LF）2行、特殊文字（&、<、>、「」）を含める
  // 日報入力・提出画面を開く
  await page.goto('/panels/scr-1790147087109.html');

  const textarea = page.locator('#rp-content');

  // 準備したテスト用日報データを報告内容入力欄に貼り付ける
  await textarea.fill(REPORT_CONTENT);
  await expect(textarea).toHaveValue(REPORT_CONTENT);

  // 妥当性チェック（バリデーション）を実行する
  await expect(page.locator('#rp-validation')).toContainText(/入力OK|OK/);
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeEnabled();

  // チェック完了後、提出ボタンを押下する
  await submitBtn.click();
  await expect(page.locator('#rp-success')).toBeVisible({ timeout: 5000 });

  // 日報確認・管理画面へ遷移する
  await page.goto('/panels/scr-1790147095974.html');

  // 提出済みの日報詳細を開く（一覧から該当日報を選択、詳細表示）
  const firstRow = page.locator('#rm-r-tbody tr').first();
  await expect(firstRow).toBeVisible();
  await firstRow.locator('.rm-detail-btn').click();

  // 画面上に表示された報告内容テキストを確認
  const modalBody = page.locator('#rm-view-modal-body');
  await expect(page.locator('#rm-view-modal')).toBeVisible();

  const bodyHtml = await modalBody.innerHTML();
  const bodyText = await modalBody.textContent();

  // 期待結果: 報告内容が以下を満たす形で表示される
  // (1) 改行がそのまま保持され、2行として視認できる
  expect((bodyText ?? '').includes('システム改修')).toBe(true);
  expect((bodyText ?? '').includes('DB設計')).toBe(true);

  // (2) 特殊文字（&、<、>、「」）が HTML エスケープまたはテキストノードとして正しく処理される
  // HTML内にエスケープされた特殊文字が含まれていることを確認
  expect(bodyHtml).toMatch(/&amp;|&/);
  expect(bodyHtml).toMatch(/&gt;|>/);
  expect(bodyHtml).toMatch(/「|「/);

  // (3) テキストの破損・文字化け・タグ注入による予期しない装飾変更が生じない
  expect(bodyHtml).not.toContain('<script');
  expect(bodyText ?? '').toContain('「進捗報告書」');
  expect(bodyText ?? '').toContain('DB設計');
});
