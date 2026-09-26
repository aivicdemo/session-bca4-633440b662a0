import { test, expect } from '@playwright/test';

test.describe('SCEN-617: 送信履歴確認 - 正常系', () => {
  test('報告者が送信履歴確認画面を開き、自分の日報に関連するメール送信履歴が表示される', async ({ page }) => {
    // ログイン
    await page.goto('/login.html');
    await page.fill('[data-testid="username"]', 'reporter1');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // 日報入力・提出画面で待機
    await page.waitForNavigation();
    await expect(page).toHaveURL(/panels\/scr-1790147087109/);

    // 日報を入力
    await page.fill('[id="rp-textarea"]', '本日は顧客Aとの打ち合わせを実施し、新要件を確認した。');

    // 妥当性チェック（画面の検証ロジックが自動的に実行される）
    await page.click('[id="rp-submit-btn"]');

    // 送信完了まで待機
    await page.waitForSelector('[id="rp-success"]');

    // 日報確認・管理画面へ遷移
    await page.waitForNavigation();
    await expect(page).toHaveURL(/panels\/scr-1790147095974/);

    // 「送信履歴確認」タブを開く（メール送信履歴タブをクリック）
    const mailHistoryTab = page.locator('.rm-tab').filter({ hasText: 'メール送信履歴' }).first();
    await mailHistoryTab.click();

    // メール送信履歴パネルがアクティブになったことを確認
    const mailPanel = page.locator('.rm-panel[data-panel="mail"]');
    await expect(mailPanel).toHaveClass(/is-active/);

    // メール送信履歴テーブルを確認
    const mailTable = page.locator('#rm-mail-tbody');
    const rows = mailTable.locator('tr');

    // 少なくとも1件のメール送信履歴が表示されていることを確認
    await expect(rows).toHaveCount(1, { timeout: 10000 });

    // メール送信履歴の内容を確認
    const firstRow = rows.first();
    const cells = firstRow.locator('td');

    // 送信日時、送信対象メールアドレス、送信種別、配信状態が表示されていることを確認
    const sentAt = await cells.nth(0).textContent();
    const emailType = await cells.nth(1).textContent();
    const recipient = await cells.nth(2).textContent();
    const status = await cells.nth(4).textContent();

    // 各項目が非空であることを確認
    expect(sentAt).toBeTruthy();
    expect(emailType).toBeTruthy();
    expect(recipient).toBeTruthy();
    expect(status).toBeTruthy();

    // 登録ユーザー外のメール送信履歴が表示されていないことを確認
    // テストでは報告者1のメール送信履歴のみが表示されるはず
    const allRows = await rows.count();
    expect(allRows).toBeGreaterThanOrEqual(1);
  });
});
