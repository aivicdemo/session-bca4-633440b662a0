import { test, expect, type Page } from '@playwright/test';

// SCEN-635: 日報が対象日を『YYYY年MM月DD日（曜日）』形式で表示される
//
// panels/scr-1790147095974.html の詳細確認モーダル（#rm-view-modal）は、openViewModal 呼び出し時に
// タイトル（#rm-view-modal-title）を「<報告者名> さんの日報（<date>）」という形式で組み立てるが、
// <date> はモック配列 reports の date フィールド（例: '2026-09-22'）を escapeHtml しただけの生の
// 'YYYY-MM-DD' 形式であり、和暦の年月日表記（『年』『月』『日』）や曜日（例：『（月）』）は付与されない。
// 詳細設計上も、formatDailyReportForDisplay（daily-report-management-view.ts）の入出力定義には
// 対象日の表示形式として『YYYY年MM月DD日（曜日）』という具体的なフォーマット文言の指定は見当たらない。
// 本テストは仕様の期待結果の文言（正規表現）どおりに検証を記述したが、現状のサンプル実装では
// 成立しない可能性が高い。詳細は .aivic/batches/9/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報が対象日を『YYYY年MM月DD日（曜日）』形式で表示される', async ({ page }) => {
  // 日報確認・管理画面を開く
  await login(page, 'leader_scen635');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const reportsTab = page.locator('.rm-tab[data-tab="reports"]');
  await expect(reportsTab).toHaveClass(/is-active/);

  // 提出済みの日報を1件選択し、詳細表示する
  const targetRow = page.locator('#rm-r-tbody tr').first();
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-detail-btn').click();
  await expect(page.locator('#rm-view-modal')).toHaveClass(/is-visible/);

  // 日報詳細画面で対象日の表示形式を確認する
  // 対象日が『YYYY年MM月DD日（曜日）』形式で表示されている（例：『2024年1月15日（月）』）
  const dateFormatPattern = /\d{4}年\d{1,2}月\d{1,2}日（[月火水木金土日]）/;
  await expect(page.locator('#rm-view-modal-title')).toHaveText(dateFormatPattern);
});
