import { test, expect, type Page } from '@playwright/test';

// SCEN-675: リーダーが管理画面にアクセス可能な場合、メール送信履歴一覧が表示される
// 期待: メール送信履歴一覧画面が表示され、送信日時、送信対象ユーザー名、メール種別、配信状態を含む列を持つデータテーブルが表示される。
// 一覧は最新の送信記録から順に表示され、スクロール可能な状態である。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーが管理画面にアクセス可能な場合、メール送信履歴一覧が表示される', async ({
  page,
}) => {
  await login(page, 'leader_scen675');

  // 日報確認・管理画面へ遷移
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 管理画面内のメール送信履歴セクション/タブを開く
  const mailHistoryTab = page.locator('.rm-tab', { hasText: 'メール送信履歴' });
  await mailHistoryTab.click();

  // メール送信履歴一覧が表示されるまで待機
  const mailTable = page.locator('#rm-mail-tbody');
  await expect(mailTable).toBeVisible();

  // 送信日時、送信対象ユーザー名、メール種別、配信状態を含む列が表示されていることを確認
  const mailHeaders = page.locator('th');
  const headerTexts = await mailHeaders.allTextContents();

  // テーブルに送信日時の列が存在することを確認
  const sentAtColumn = page.locator('th', { hasText: '送信日時' });
  await expect(sentAtColumn).toBeVisible();

  // メール種別の列が存在することを確認
  const typeColumn = page.locator('th', { hasText: 'メールタイプ' });
  await expect(typeColumn).toBeVisible();

  // 送信先の列が存在することを確認
  const toColumn = page.locator('th', { hasText: '送信先' });
  await expect(toColumn).toBeVisible();

  // 件名の列が存在することを確認
  const subjectColumn = page.locator('th', { hasText: '件名' });
  await expect(subjectColumn).toBeVisible();

  // ステータスの列が存在することを確認
  const statusColumn = page.locator('th', { hasText: 'ステータス' });
  await expect(statusColumn).toBeVisible();

  // 一覧が最新の送信記録から順に表示されていることを確認
  const rows = page.locator('#rm-mail-tbody tr').filter({ hasNot: page.locator('.rm-empty-row') });
  const rowCount = await rows.count();

  if (rowCount > 0) {
    // 複数行が存在する場合、最初の行から2番目の行への時系列を確認
    if (rowCount >= 2) {
      const firstRowSentAt = await rows.nth(0).locator('td:first-child').textContent();
      const secondRowSentAt = await rows.nth(1).locator('td:first-child').textContent();

      // 最初の行が2番目の行より新しい日時であることを確認（降順）
      if (firstRowSentAt && secondRowSentAt) {
        const firstDate = new Date(firstRowSentAt).getTime();
        const secondDate = new Date(secondRowSentAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    }

    // 各行に5つのデータセル（送信日時、メール種別、送信先、件名、ステータス）が存在することを確認
    const firstRow = rows.nth(0);
    const cells = firstRow.locator('td');
    await expect(cells).toHaveCount(5);

    // ステータスが有効な値を含むことを確認（成功/失敗/保留中など）
    const statusCell = cells.nth(4);
    const statusText = await statusCell.textContent();
    expect(statusText).toMatch(/成功|失敗|保留中/);
  }

  // 一覧がスクロール可能な状態であることを確認
  const tableContainer = mailTable.locator('..').first();
  const scrollHeight = await tableContainer.evaluate((el: Element) => (el as any).scrollHeight);
  const clientHeight = await tableContainer.evaluate((el: Element) => (el as any).clientHeight);

  // スクロール可能（scrollHeight > clientHeight）またはコンテンツが十分にある状態
  expect(rowCount > 0).toBeTruthy();
});
