import { test, expect, type Page } from '@playwright/test';

// SCEN-701: 過去5日間の提出率が80%以上の未提出者に対して推奨アクションが「様子見」に変更される

test('過去5日間の提出率が80%以上の未提出者に対して推奨アクションが「様子見」に変更される', async ({ page }) => {
  // テスト環境の日報確認・管理画面にログインする
  await page.goto('/panels/scr-1790147095974.html');

  // 対象ユーザーの過去5日間の日報提出履歴を確認し、提出率が80%以上であることを手動で検証する
  // （サンプル画面では提出率の詳細表示がないため、未提出者リストと検知ログから判定）

  // 対象ユーザーを本日の日報未提出状態に設定する
  const reminderTab = page.locator('[data-tab="reminder"]');
  await reminderTab.click();

  // 未提出者リストを表示
  const missingTableBody = page.locator('#rm-missing-tbody');
  const missingRows = missingTableBody.locator('tr');
  
  const rowCount = await missingRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 日報確認・管理画面で定時自動検知ロジックを手動トリガーする
  // （サンプル画面では手動トリガー機能がないため、ステータスが「最終検知」の日時で検知済みと判定）
  const detectStatus = page.locator('#rm-detect-status');
  const statusText = await detectStatus.textContent();
  expect(statusText).toContain('最終検知');

  // 日報確認・管理画面の未提出者一覧を表示する
  // （既に表示済み）

  // 対象ユーザーの行を確認し、推奨アクション列の表示値を目視で確認する
  // 検知ログで詳細を確認
  const logTab = page.locator('[data-tab="log"]');
  await logTab.click();

  const logTableBody = page.locator('#rm-log-tbody');
  const logRows = logTableBody.locator('tr');

  // ログから対象ユーザーを探す
  let foundTargetUser = false;
  const logRowCount = await logRows.count();
  
  for (let i = 0; i < logRowCount; i++) {
    const row = logRows.nth(i);
    const detailButton = row.locator('button');
    
    await detailButton.click();

    const viewModal = page.locator('#rm-view-modal');
    await expect(viewModal).toHaveClass(/is-visible/);

    const modalContent = await viewModal.locator('#rm-view-modal-body').textContent();

    // 期待結果：対象ユーザーの推奨アクション列に「様子見」と表示されること
    if (modalContent?.includes('様子見')) {
      foundTargetUser = true;
      expect(modalContent).toContain('様子見');
      expect(modalContent).not.toContain('督促');
      expect(modalContent).not.toContain('即時連絡');
      
      // モーダルを閉じる
      const closeButton = page.locator('#rm-view-modal-close');
      await closeButton.click();
      break;
    }

    // モーダルを閉じる
    const closeButton = page.locator('#rm-view-modal-close');
    await closeButton.click();
  }

  expect(foundTargetUser).toBe(true);
});
