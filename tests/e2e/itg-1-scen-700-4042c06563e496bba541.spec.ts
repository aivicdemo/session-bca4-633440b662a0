import { test, expect, type Page } from '@playwright/test';

// SCEN-700: 連続未提出が2日目以上の未提出者に対して推奨アクションが「直接指示」と判定される

test('連続未提出が2日目以上の未提出者に対して推奨アクションが「直接指示」と判定される', async ({ page }) => {
  // テスト環境で日報確認・管理画面にログインする（管理者権限）
  await page.goto('/panels/scr-1790147095974.html');

  // 未提出者リストを表示する - 未提出者・リマインダータブに切り替え
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();

  // 連続未提出が2日目以上のユーザーが一覧に表示されていることを確認する
  const missingTableBody = page.locator('#rm-missing-tbody');
  const missingRows = missingTableBody.locator('tr');
  
  // 未提出者が存在すること
  const rowCount = await missingRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // ユーザーの行から情報を取得
  const firstMissingRow = missingRows.first();
  const userName = await firstMissingRow.locator('td:nth-child(2)').textContent();
  
  // 検知ログタブに切り替えて、対象ユーザーの詳細を確認
  const logTab = page.locator('[data-tab="log"]');
  await logTab.click();

  const logTableBody = page.locator('#rm-log-tbody');
  const logRows = logTableBody.locator('tr');

  // 対象ユーザーのログ行を探す
  let targetLogRow: any = null;
  const logRowCount = await logRows.count();
  
  for (let i = 0; i < logRowCount; i++) {
    const row = logRows.nth(i);
    const rowUserName = await row.locator('td:first-child').textContent();
    if (rowUserName === userName) {
      targetLogRow = row;
      break;
    }
  }

  expect(targetLogRow).not.toBeNull();

  // 詳細ボタンをクリック
  if (targetLogRow) {
    const detailButton = targetLogRow.locator('button');
    await detailButton.click();

    // 詳細パネル内で「推奨アクション」フィールドが表示されていることを確認する
    const viewModal = page.locator('#rm-view-modal');
    await expect(viewModal).toHaveClass(/is-visible/);

    const modalBody = page.locator('#rm-view-modal-body');
    const modalContent = await modalBody.textContent();

    // 期待結果：ユーザーAの詳細パネルに表示される「推奨アクション」フィールドの値が「直接指示」である
    expect(modalContent).toContain('直接指示');
  }
});
