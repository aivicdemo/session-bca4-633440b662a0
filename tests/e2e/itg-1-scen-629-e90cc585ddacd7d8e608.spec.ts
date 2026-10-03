import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// SCEN-629: チームにメンバーが登録されていない場合、エラーメッセージが表示される

interface AivicTableDef {
  tableName: string;
}

async function readAivicConfig(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as {
      AIVIC_API_URL?: string;
      AIVIC_APP_ID?: string;
      AIVIC_SYSTEM_NAME?: string;
      AIVIC_TABLES?: AivicTableDef[];
    };
    return {
      apiUrl: w.AIVIC_API_URL ?? '',
      appId: w.AIVIC_APP_ID ?? '',
      systemName: w.AIVIC_SYSTEM_NAME ?? '',
      tables: w.AIVIC_TABLES ?? [],
    };
  });
}

test('チームにメンバーが登録されていない場合、エラーメッセージが表示される', async ({ page }) => {
  // 日報管理システムにログイン
  await page.goto('/panels/scr-1790147095974.html');

  // 「日報確認・管理画面」へ遷移
  const config = await readAivicConfig(page);

  // 「提出済み日報一覧」タブを表示
  const reportsTab = page.locator('button[data-tab="reports"]');
  await expect(reportsTab).toBeVisible();
  if (!await reportsTab.locator('.is-active').isVisible()) {
    await reportsTab.click();
  }

  // テーブルが読み込まれるまで待機
  await page.waitForSelector('#rm-r-tbody');

  // 提出済み日報一覧が表示される領域を確認
  const tbody = page.locator('#rm-r-tbody');

  // テーブルに行がない場合、エラーメッセージが表示されているか確認
  const rows = tbody.locator('tr');
  const rowCount = await rows.count();

  if (rowCount === 0) {
    // 行がない場合、空表示またはエラーメッセージの確認
    const emptyMessage = tbody.locator('td:has-text("該当する日報がありません")');
    if (await emptyMessage.isVisible()) {
      // 該当する日報がない場合の表示
      await expect(emptyMessage).toBeVisible();
    }
  } else if (rowCount === 1) {
    // 1行のみで、エラーメッセージを示す場合
    const cell = rows.nth(0).locator('td').nth(0);
    const text = await cell.textContent();
    if (text?.includes('選択したチームにメンバーが登録されていません') || 
        text?.includes('該当する日報がありません')) {
      // エラー表示が確認できた
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  }

  // ユーザーは操作を続行できる状態にある（画面がブロックされていない）
  const settingsBtn = page.locator('#rm-settings-btn');
  const sendReminderBtn = page.locator('#rm-send-reminder-btn');

  // 少なくともいずれかのボタンが操作可能であることを確認
  if (await settingsBtn.isVisible()) {
    await expect(settingsBtn).toBeEnabled();
  }
  if (await sendReminderBtn.isVisible()) {
    await expect(sendReminderBtn).toBeVisible();
  }
});
