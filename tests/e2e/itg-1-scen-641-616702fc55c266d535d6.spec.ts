import { test, expect, type Page } from '@playwright/test';

// SCEN-641: 提出日時が不正な値である場合、エラーメッセージが表示される
//
// panels/scr-1790147095974.html の「提出済み日報」タブ（#rm-r-tbody）は window.AIVIC_PAGE_INIT_JS 内に
// ハードコードされた固定配列（reports）を表示するのみで、window.AIVIC_API_URL の「日報」テーブルを参照
// していない（.aivic/batches/1/unresolved.md に同種の記録がある）。そのため、提出日時が不正な値
// （2024-13-45 25:70:99、null、空文字列等）を持つ日報レコードをテストデータとして用意しても、この一覧・
// 詳細表示には反映されない。また、提出日時の形式エラーを画面上に表示するUI・メッセージ（詳細設計
// daily-report-management-view.ts の MalformedSubmissionTimeError「提出日時の形式が不正です。」に近い概念は
// あるが、対応するUI実装は存在しない）も存在しない。本テストは、仕様の期待結果を弱めずに、提出済み日報一覧
// から提出日時が不正な日報レコードを特定し、詳細表示を試みた際にエラーメッセージが表示され詳細情報が
// 表示されないことをそのまま検証する。詳細は unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('提出日時が不正な値である場合、エラーメッセージが表示される', async ({ page }) => {
  // 手順1: 日報確認・管理画面にアクセスする
  await login(page, 'leader_scen641');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順2: 提出済み日報の一覧から、提出日時が不正な値（例：2024-13-45 25:70:99、または null、空文字列など）
  // を持つ日報レコードを特定する
  const rows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  const invalidSubmittedAtRow = rows
    .filter({ has: page.locator('td:nth-child(4)', { hasText: /^$|2024-13-45|25:70:99|Invalid Date|NaN/ }) })
    .first();
  await expect(invalidSubmittedAtRow).toBeVisible();

  // 手順3: 該当の日報レコードをクリックして詳細を開く
  await invalidSubmittedAtRow.locator('.rm-detail-btn').click();

  // 手順4/期待結果: 「提出日時が不正な形式です」または「提出日時を読み込めません」というエラーメッセージが
  // 画面上に表示され、該当日報の詳細情報は表示されない状態となる
  await expect(page.getByText(/提出日時が不正な形式です|提出日時を読み込めません/)).toBeVisible();
  await expect(page.locator('#rm-view-modal-body')).not.toContainText(/業務内容|成果|課題/);
});
