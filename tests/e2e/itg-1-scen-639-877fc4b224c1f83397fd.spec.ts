import { test, expect, type Page } from '@playwright/test';

// SCEN-639: 日報が定時（17:00）以降に提出された場合、遅延フラグが表示される
//
// panels/scr-1790147095974.html の「提出済み日報」タブ（#rm-r-tbody）は、報告者名・報告日・業務内容・
// 提出日時・詳細ボタンのみの列構成で、提出時刻が17:00以降であることを示す遅延フラグ（バッジ・アイコン等）
// を表示するマークアップ・スタイルは実装されていない。また同タブはハードコードされたモック配列（reports）を
// 表示するのみで、panels/scr-1790147087109.html から実際に提出した内容も反映されない
// （.aivic/batches/1/unresolved.md に同種の記録がある）。本テストは、仕様の期待結果を弱めずに、17:00以降に
// 提出した日報の行に遅延フラグが表示されることをそのまま検証する。詳細は unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報が定時（17:00）以降に提出された場合、遅延フラグが表示される', async ({ page }) => {
  // 現在時刻が17:00以降であることを確認した状態で実施するため、システム時刻を17:30に固定する
  await page.clock.install({ time: new Date('2026-09-23T17:30:00') });

  // 手順1: 日報入力・提出画面にアクセスし、報告者として「本日の業務内容」欄に任意のテキストを入力する
  await login(page, 'reporter_scen639');
  const textarea = page.locator('#rp-content');
  await textarea.fill('SCEN-639検証用: 定時後提出の遅延フラグ表示を確認するための業務内容記載');
  await expect(page.locator('#rp-submit-btn')).toBeEnabled();

  // 手順2: 提出ボタンをクリックして日報を提出する（現在時刻が17:00以降であることを確認した状態で実施）
  await page.locator('#rp-submit-btn').click();
  await expect(page.locator('#rp-success')).toBeVisible({ timeout: 5000 });

  // 手順3: 日報確認・管理画面にアクセスし、提出済み日報一覧を表示する
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順4: 提出した日報のレコードを特定し、そのレコード行または詳細表示エリアを確認する
  const targetRow = page.locator('#rm-r-tbody tr', { hasText: 'SCEN-639検証用' }).first();
  await expect(targetRow).toBeVisible();

  // 期待結果: 提出時刻が17:00以降であることを示す遅延フラグ（視覚的に区別される表示、
  // 例：赤色背景「遅延」テキスト、アイコン等）が当該日報レコード上に表示される
  await expect(targetRow.getByText(/遅延/)).toBeVisible();
});
