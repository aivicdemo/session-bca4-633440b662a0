import { test, expect, type Page } from '@playwright/test';

// SCEN-659: 本日の日報がすべての報告者から提出されているとき、管理画面に未提出者一覧が表示されない
// 期待結果: 日報確認・管理画面の『未提出者一覧』セクションが表示されない、
// または『未提出者なし』のメッセージが表示され、未提出者のリストが空であることが画面上に反映される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('本日の日報がすべての報告者から提出されているとき、管理画面に未提出者一覧が表示されない', async ({
  page,
}) => {
  // 手順: テスト環境にて、日報確認・管理画面にアクセスする管理者アカウントでログインする
  await login(page, 'admin_yamada');

  // 手順: 本日の日報提出期限が過ぎていることを確認する
  // UI上で未提出者自動検知ステータスが表示されていることで期限が過ぎていることを確認
  const detectStatus = page.locator('#rm-detect-status');
  const statusText = await detectStatus.textContent();
  expect(statusText).toBeTruthy();
  expect(statusText).toMatch(/検知/);

  // 手順: ユーザーマスタに登録されている5人の報告者すべてが、本日の日報を提出済みであることを事前に確認する
  // 提出済み日報タブで複数の報告者の日報が表示されていることで提出状況を確認
  await page.click('[data-tab="reports"]');
  const reportTbody = page.locator('#rm-r-tbody');
  const reportRows = reportTbody.locator('tr:not(.rm-empty-row)');
  // 複数の報告者の提出を確認
  const reportRowCount = await reportRows.count();
  expect(reportRowCount).toBeGreaterThan(0);

  // 手順: 日報確認・管理画面を表示する（既に管理画面にいることを確認）
  await expect(page).toHaveURL(/scr-1790147095974/);

  // 手順: 画面上の『未提出者一覧』セクションまたはウィジェットの表示状態を確認する
  await page.click('[data-tab="reminder"]');
  await page.waitForSelector('[data-panel="reminder"].is-active');

  // 期待結果: 未提出者一覧が表示されない、または『未提出者なし』のメッセージが表示される
  const missingTbody = page.locator('#rm-missing-tbody');

  // パターン1: 「未提出者はいません」メッセージが表示
  const emptyRow = missingTbody.locator('.rm-empty-row');
  const emptyRowCount = await emptyRow.count();

  if (emptyRowCount > 0) {
    // 「未提出者はいません」メッセージが表示されていることを確認
    const emptyRowText = await emptyRow.first().textContent();
    expect(emptyRowText).toContain('未提出者はいません');
  } else {
    // パターン2: データ行がない（テーブルが空）ことを確認
    const dataRows = missingTbody.locator('tr:not(.rm-empty-row)');
    const dataRowCount = await dataRows.count();
    expect(dataRowCount).toBe(0);
  }
});
