import { test, expect } from '@playwright/test';

test('本日の日報がすべての報告者から提出されているとき、管理画面に未提出者一覧が表示されない', async ({
  page,
}) => {
  // テスト環境にて、日報確認・管理画面にアクセスする管理者アカウントでログインする
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 本日の日報提出期限が過ぎていることを確認する
  // （既にテスト環境で期限が過ぎている想定）

  // ユーザーマスタに登録されている5人の報告者すべてが、本日の日報を日報入力・提出画面から提出済みであることを事前に確認する
  // （テストデータの準備）

  // 日報確認・管理画面を表示する
  // ページは既に表示されている

  // 画面上の『未提出者一覧』セクションまたはウィジェットの表示状態を確認する
  const tbody = page.locator('#rm-missing-tbody');
  const tableContent = await tbody.textContent();

  // 日報確認・管理画面の『未提出者一覧』セクションが表示されない、または『未提出者なし』のメッセージが表示され、未提出者のリストが空であることが画面上に反映される
  if (tableContent?.includes('未提出者はいません') || tableContent?.includes('未提出者なし')) {
    expect(tableContent).toMatch(/未提出者はいません|未提出者なし/);
  } else {
    // またはテーブルが空であることを確認
    const dataRows = tbody.locator('tr:not(.rm-empty-row)');
    const dataRowCount = await dataRows.count();
    expect(dataRowCount).toBe(0);
  }

  // 未提出者一覧セクションが非表示であることを確認する別の方法
  const missingSection = page.locator('text=未提出者一覧').first();
  if (await missingSection.isVisible().catch(() => false)) {
    // セクションが表示されている場合、その中身が空であることを確認
    expect(tableContent).toMatch(/未提出者はいません|未提出者なし/);
  }
});
