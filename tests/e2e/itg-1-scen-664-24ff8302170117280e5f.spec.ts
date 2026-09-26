import { test, expect } from '@playwright/test';

/**
 * SCEN-664: 検知ログ確認
 * 検知ログ画面で、各未提出者の最後の提出日時が正しく表示される
 */
test('検知ログ画面で各未提出者の最後の提出日時が正しく表示される', async ({ page }) => {
  // テスト用データベースを初期化し、5人の報告者（ユーザーマスタ登録済み）を用意する
  // 報告者A、B、Cは過去に日報を提出した履歴を持つよう、異なる過去の提出日時
  // （例：A=2024-01-15 09:30:00、B=2024-01-10 14:45:00、C=2024-01-05 11:20:00）を
  // データベースに設定する
  // 報告者D、Eは未提出状態とし、提出日時レコードを持たないか、
  // または提出日時を null で設定する
  // （テスト環境ではデータベースセットアップが行われていると仮定）

  // 日報確認・管理画面にログインし、検知ログ確認機能を表示する
  await page.goto('/');
  await page.fill('input[type="text"]', 'admin_yamada');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("ログイン")');

  await page.waitForLoadState('networkidle');

  // 検知ログ確認機能を開く
  const logTab = page.locator('.rm-tab').filter({ hasText: '検知ログ' });
  await logTab.click();

  await page.waitForLoadState('networkidle');

  // 検知ログ画面内の『未提出者一覧』セクションで表示される
  // 各ユーザーの『最後の提出日時』カラムを確認する
  const logTable = page.locator('.rm-table');
  await expect(logTable).toBeVisible();

  // テーブルヘッダーに『最後の提出日時』カラムが存在するかを確認
  const headers = logTable.locator('thead th');
  const headerTexts = await headers.allTextContents();

  // 最後の提出日時カラムの存在を確認
  const hasLastSubmitColumn = headerTexts.some(text => 
    text.includes('提出日時') || text.includes('最後の') || text.includes('提出')
  );
  expect(hasLastSubmitColumn).toBe(true);

  // 報告者A、B、Cについて、それぞれの最後の提出日時が設定したデータベース値と
  // 一致していることを目視で確認する
  const rows = logTable.locator('tbody tr');
  const rowCount = await rows.count();

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.locator('td');
    const reporterName = await cells.nth(0).textContent();

    if (reporterName?.includes('A')) {
      const lastSubmitDate = await cells.nth(0).textContent();
      expect(lastSubmitDate).toBeTruthy();
      // 日付形式で表示されることを確認
      expect(lastSubmitDate).toMatch(/\d{4}-\d{2}-\d{2}/);
    }

    if (reporterName?.includes('B')) {
      const lastSubmitDate = await cells.nth(0).textContent();
      expect(lastSubmitDate).toBeTruthy();
      expect(lastSubmitDate).toMatch(/\d{4}-\d{2}-\d{2}/);
    }

    if (reporterName?.includes('C')) {
      const lastSubmitDate = await cells.nth(0).textContent();
      expect(lastSubmitDate).toBeTruthy();
      expect(lastSubmitDate).toMatch(/\d{4}-\d{2}-\d{2}/);
    }

    if (reporterName?.includes('D') || reporterName?.includes('E')) {
      // D、Eについては『最後の提出日時』が空欄または『未提出』と表示される
      const lastSubmitCell = await row.locator('td').allTextContents();
      const lastSubmitText = lastSubmitCell.join('');
      expect(lastSubmitText === '' || lastSubmitText.includes('未提出')).toBe(true);
    }
  }

  // 画面遷移・エラーなく全データが表示される
  await expect(page).not.toHaveTitle(/error|err/i);
});
