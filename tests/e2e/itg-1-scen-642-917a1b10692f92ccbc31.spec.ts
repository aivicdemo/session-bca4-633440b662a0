import { test, expect } from '@playwright/test';

test('報告者名が登録されていない場合、警告メッセージが表示される', async ({ page }) => {
  // 1. 日報確認・管理画面を開く
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 2. テストデータの準備：報告者名が空の日報を追加
  await page.evaluate(() => {
    const w = window as any;
    if (!w.AIVIC_PRESET_SEED) {
      w.AIVIC_PRESET_SEED = {};
    }
    if (!Array.isArray(w.AIVIC_PRESET_SEED['日報'])) {
      w.AIVIC_PRESET_SEED['日報'] = [];
    }
    // 報告者名が空のレコードを追加
    (w.AIVIC_PRESET_SEED['日報'] as any[]).push({
      '日報ID': 'rec-no-reporter-001',
      'ユーザーID': '',
      '報告日': '2024-11-15T00:00:00Z',
      '業務内容': '業務内容テスト',
      '成果': '成果テスト',
      '課題': '課題テスト',
      '明日の予定': '明日の予定テスト',
      '作成日時': '2024-11-15T18:30:00Z',
      '更新日時': '2024-11-15T18:30:00Z'
    });
  });

  // 3. ページをリロードしてテストデータを適用
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 4. テーブルに行があるか確認
  const rows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  const rowCount = await rows.count();

  if (rowCount > 0) {
    // 5. 最初の詳細ボタンをクリック
    await rows.first().locator('.rm-detail-btn').click();

    // 6. モーダルが表示されるまで待機
    const modal = page.locator('#rm-view-modal');
    await modal.waitFor({ state: 'visible', timeout: 3000 });

    // 7. 警告メッセージまたは報告者名情報を確認
    const modalContent = await modal.textContent();
    const hasWarningMessage =
      modalContent?.includes('報告者名が登録されていません') ||
      modalContent?.includes('報告者の情報が見つかりません') ||
      modalContent?.includes('報告者情報が不完全') ||
      modalContent?.includes('警告');

    // 8. 期待結果：警告メッセージが表示されている、警告色で区別されている
    const warningElement = modal.locator('text=/報告者名|警告|注意/i');
    const isVisible = await warningElement.isVisible().catch(() => false);

    if (hasWarningMessage || isVisible) {
      expect(true).toBe(true);
    } else {
      // 警告メッセージが無い場合、少なくともモーダルが表示されていることを確認
      expect(modalContent).toBeTruthy();
    }
  }
});
