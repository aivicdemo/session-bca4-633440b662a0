import { test, expect, type Page } from '@playwright/test';

// SCEN-642: 報告者名が登録されていない場合、警告メッセージが表示される
//
// panels/scr-1790147095974.html の「提出済み日報」タブ（#rm-r-tbody）は window.AIVIC_PAGE_INIT_JS 内に
// ハードコードされた固定配列（reports）を表示するのみで、各要素には常に報告者名（氏名）が設定されている。
// 報告者名フィールドが空の状態で保存された日報レコードを用意しても、この一覧は永続化データ（window.AIVIC_API_URL
// の「日報」テーブル）を参照しないため反映されない（.aivic/batches/1/unresolved.md に同種の記録がある）。
// また、報告者名欠落時に「報告者名が登録されていません」等の警告（黄色・オレンジ等の警告色）を表示するUI実装も
// 存在しない。本テストは、仕様の期待結果を弱めずに、報告者名が空の日報の詳細確認画面を開いた際に警告色の
// 警告メッセージが表示されることをそのまま検証する。詳細は unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者名が登録されていない場合、警告メッセージが表示される', async ({ page }) => {
  // 手順1: 日報確認・管理画面を開く
  await login(page, 'leader_scen642');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順2: 提出済み日報の一覧から、報告者名フィールドが空の状態で保存された日報レコードを検索する
  const rows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  const missingNameRow = rows.filter({ has: page.locator('td:nth-child(1)', { hasText: /^$/ }) }).first();
  await expect(missingNameRow).toBeVisible();

  // 手順3: 該当する日報レコードをクリックして詳細確認画面を開く
  await missingNameRow.locator('.rm-detail-btn').click();

  // 手順4/期待結果: 「報告者名が登録されていません」または同等の警告メッセージが表示される。
  // メッセージは文字色が警告色（黄色・オレンジ等）で区別される。
  const warning = page.getByText(/報告者名が登録されていません/);
  await expect(warning).toBeVisible();
  const color = await warning.evaluate((el) => getComputedStyle(el).color);
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(rgbMatch).not.toBeNull();
  const [, r, , b] = (rgbMatch ?? ['', '0', '0', '0']).map(Number);
  expect(r).toBeGreaterThan(150);
  expect(b).toBeLessThan(100);
});
