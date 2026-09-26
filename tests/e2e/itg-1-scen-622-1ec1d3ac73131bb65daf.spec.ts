import { test, expect } from '@playwright/test';

test.describe('SCEN-622: 送信履歴確認 - メール送信履歴詳細表示', () => {
  test('送信履歴確認画面で、当該報告者が送信した日報に関連するメール送信履歴のデータセットが画面に表示される', async ({ page }) => {
    // ログイン
    await page.goto('/login.html');
    await page.fill('[data-testid="username"]', 'reporter1');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // 日報入力・提出画面で待機
    await page.waitForNavigation();
    await expect(page).toHaveURL(/panels\/scr-1790147087109/);

    // 日報を入力
    await page.fill('[id="rp-textarea"]', '本日の業務内容：システムA の障害対応を実施し、ログ確認と暫定対処を適用した。');

    // 提出
    await page.click('[id="rp-submit-btn"]');

    // 送信完了まで待機
    await page.waitForSelector('[id="rp-success"]');

    // 日報確認・管理画面へ遷移
    await page.waitForNavigation();
    await expect(page).toHaveURL(/panels\/scr-1790147095974/);

    // 「送信履歴確認」セクションを開く
    const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' }).first();
    await mailHistoryTab.click();

    // 当該報告者のメール送信履歴一覧を確認
    const mailTable = page.locator('#rm-mail-tbody');
    const rows = mailTable.locator('tr');

    // 少なくとも1件のメール送信履歴が表示されていることを確認
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // 最初のメール送信履歴行をチェック
    const firstRow = rows.first();
    const cells = firstRow.locator('td');

    // 各フィールドを確認
    const sentAtText = await cells.nth(0).textContent();  // 送信日時
    const emailTypeText = await cells.nth(1).textContent();  // 送信ステータス（リマインダー、提出通知など）
    const recipientText = await cells.nth(2).textContent();  // 送信先
    const subjectText = await cells.nth(3).textContent();  // 件名
    const statusText = await cells.nth(4).textContent();  // 送信ステータス（配信成功など）

    // 各フィールドが非空で、適切な形式で表示されていることを確認
    expect(sentAtText).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}|\d{1,2}:\d{2}/); // ISO形式の日時
    expect(emailTypeText).toMatch(/リマインダー|提出通知|催促/i);
    expect(recipientText).toMatch(/.+@.+\..+/); // メールアドレス形式
    expect(subjectText).toBeTruthy();
    expect(statusText).toMatch(/成功|配信成功|失敗|配信失敗|保留中/i);

    // エラー情報フィールドが存在する場合は確認
    const cellCount = await cells.count();
    if (cellCount > 5) {
      const errorInfoText = await cells.nth(5).textContent();
      // エラー情報は「なし」または具体的なエラーメッセージ
      if (errorInfoText) {
        expect(errorInfoText).toBeTruthy();
      }
    }
  });
});
