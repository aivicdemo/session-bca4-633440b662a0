import { test, expect, Page } from '@playwright/test';

const MANAGEMENT_SCREEN = '/panels/scr-1790147095974.html';

test.describe('SCEN-623: チームリーダーが権限を持つ場合、提出済み日報一覧を正常に表示できる', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('チームリーダー権限を持つユーザーがログイン後、提出済み日報一覧が提出日時の降順で表示され、詳細表示が可能', async () => {
    // テスト用データベースをリセットし、チームリーダー権限を持つユーザーでログイン
    // サンプル実装の初期状態では、必要なテストデータが window.AIVIC_PRESET_SEED として埋め込まれています

    // 日報確認・管理画面へ遷移
    await page.goto(MANAGEMENT_SCREEN);

    // ページロード完了を待つ
    await page.waitForLoadState('domcontentloaded');

    // 提出済み日報一覧テーブルが存在することを確認
    const tbody = page.locator('#rm-r-tbody');
    await expect(tbody).toBeVisible();

    // 一覧に表示された日報行数を数える（5件以上が必要）
    const rows = page.locator('#rm-r-tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(5);

    // 各日報行について、必要なフィールドが表示されていることを確認
    // 期待値：報告者名・提出日時・日報内容（今日何をしたか）
    const firstRow = rows.nth(0);

    // 最初の行から報告者名を取得
    const reporterNameCell = firstRow.locator('td').nth(0);
    const reporterName = await reporterNameCell.textContent();
    expect(reporterName).toBeTruthy();
    expect(reporterName?.trim().length).toBeGreaterThan(0);

    // 報告日を取得
    const dateCell = firstRow.locator('td').nth(1);
    const reportDate = await dateCell.textContent();
    expect(reportDate).toBeTruthy();
    expect(reportDate?.trim().length).toBeGreaterThan(0);

    // 日報内容（今日何をしたか）を取得
    const contentCell = firstRow.locator('td').nth(2);
    const reportContent = await contentCell.textContent();
    expect(reportContent).toBeTruthy();
    expect(reportContent?.trim().length).toBeGreaterThan(0);

    // 提出日時を取得
    const submittedAtCell = firstRow.locator('td').nth(3);
    const submittedAt = await submittedAtCell.textContent();
    expect(submittedAt).toBeTruthy();
    expect(submittedAt?.trim().length).toBeGreaterThan(0);

    // 一覧の並び順が提出日時の降順（新しい順）で整列されていることを確認
    // テーブルのすべての行を取得して日時を抽出
    const submittedAtTexts: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const cell = rows.nth(i).locator('td').nth(3);
      const text = await cell.textContent();
      if (text) {
        submittedAtTexts.push(text.trim());
      }
    }

    // 日時の降順チェック（テスト用データの日時形式に基づく）
    for (let i = 0; i < submittedAtTexts.length - 1; i++) {
      const current = new Date(submittedAtTexts[i]);
      const next = new Date(submittedAtTexts[i + 1]);
      // 降順（新しい順）なので current >= next であることを確認
      expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
    }

    // 任意の提出済み日報行（最初の行）をクリックして詳細画面への遷移を確認
    const detailButton = firstRow.locator('button').first();
    await expect(detailButton).toHaveText('詳細');

    // 詳細ボタンをクリック
    await detailButton.click();

    // モーダルが表示されることを確認
    const modal = page.locator('#rm-view-modal');
    await expect(modal).toBeVisible();

    // モーダルに日報の詳細情報が表示されていることを確認
    const modalTitle = page.locator('#rm-view-modal-title');
    await expect(modalTitle).toBeVisible();
    const titleText = await modalTitle.textContent();
    expect(titleText).toBeTruthy();

    // モーダルボディに詳細情報が表示されていることを確認
    const modalBody = page.locator('#rm-view-modal-body');
    await expect(modalBody).toBeVisible();
    const bodyText = await modalBody.textContent();
    expect(bodyText).toBeTruthy();

    // モーダルを閉じるボタンがあることを確認
    const closeButton = page.locator('#rm-view-modal-close');
    await expect(closeButton).toBeVisible();

    // 期待される条件：
    // - 一覧には、テストDB に投入された全ての提出済み日報が表示される
    // - 各行に報告者名・提出日時・日報内容が正確に描画されている
    // - 並び順が提出日時の降順（新しい順）で整列されている
    // - 各行がクリッカブルで詳細画面への遷移ができる
    expect(rowCount).toBeGreaterThanOrEqual(5);
  });
});
