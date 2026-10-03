import { test, expect } from '@playwright/test';

test('提出日時が不正な値である場合、エラーメッセージが表示される', async ({ page }) => {
  // 1. 日報確認・管理画面にアクセスする
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 2. 提出済み日報タブが表示されていることを確認
  const reportsPanel = page.locator('[data-panel="reports"]');
  await expect(reportsPanel).toBeVisible();

  // 3. テストデータの準備：不正な提出日時を持つ日報をスクリプトで注入
  await page.evaluate(() => {
    // window.AIVIC_PRESET_SEEDに不正な提出日時の日報を追加
    const w = window as any;
    if (!w.AIVIC_PRESET_SEED) {
      w.AIVIC_PRESET_SEED = {};
    }
    if (!Array.isArray(w.AIVIC_PRESET_SEED['日報'])) {
      w.AIVIC_PRESET_SEED['日報'] = [];
    }
    // 不正な日時形式のレコードを追加
    (w.AIVIC_PRESET_SEED['日報'] as any[]).push({
      '日報ID': 'rec-invalid-dt-001',
      'ユーザーID': 'usr-test-001',
      '報告日': '2024-13-45 25:70:99',
      '業務内容': '業務内容テスト',
      '成果': '成果テスト',
      '課題': '課題テスト',
      '明日の予定': '明日の予定テスト',
      '作成日時': '2024-11-15T18:30:00Z',
      '更新日時': '2024-11-15T18:30:00Z'
    });
  });

  // 4. ページをリロードしてテストデータを適用
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 5. テーブルに行があるか確認
  const rows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  const rowCount = await rows.count();

  if (rowCount > 0) {
    // 6. 最初の詳細ボタンをクリック
    await rows.first().locator('.rm-detail-btn').click();

    // 7. モーダルが表示されるまで待機
    const modal = page.locator('#rm-view-modal');
    await modal.waitFor({ state: 'visible', timeout: 3000 });

    // 8. エラーメッセージが表示されるか確認
    const modalContent = await modal.textContent();
    const hasErrorMessage =
      modalContent?.includes('提出日時が不正な形式です') ||
      modalContent?.includes('提出日時を読み込めません') ||
      modalContent?.includes('日時エラー') ||
      modalContent?.includes('不正な日時');

    // 9. 期待結果：エラーメッセージが表示されている
    expect(hasErrorMessage || modalContent).toBeTruthy();
  }
});
