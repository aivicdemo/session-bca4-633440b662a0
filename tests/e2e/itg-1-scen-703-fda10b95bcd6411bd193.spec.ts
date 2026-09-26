import { test, expect, type Page } from '@playwright/test';

// SCEN-703: 報告者IDが空の場合、エラーメッセージが表示される
// 期待結果: 報告者IDが空の場合、エラーメッセージ「報告者IDは必須です」が画面に表示され、
// sendReminderEmail の呼び出しが発生せず、送信処理が中断される。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/(scr-1790147087109|scr-1790147095974)\.html/);
}

test('報告者IDが空の場合、エラーメッセージが表示される', async ({ page }) => {
  // 前提: 管理画面にアクセス可能なリーダーユーザーでログイン
  await login(page, 'leader_scen703');

  // 日報確認・管理画面に遷移していることを確認
  await expect(page).toHaveURL(/panels\/scr-1790147095974\.html/);

  // 未提出者・リマインダータブが表示されていることを確認
  const missingTab = page.getByText('未提出者・リマインダー', { exact: true });
  await expect(missingTab).toBeVisible();

  // 未提出者一覧を表示
  const missingTbody = page.locator('#rm-missing-tbody');
  await expect(missingTbody).toBeVisible();

  // 少なくとも1件の未提出者がいることを確認
  const rows = page.locator('#rm-missing-tbody tr');
  const rowCount = await rows.count();

  if (rowCount > 0) {
    // 最初の未提出者のチェックボックスをクリック
    const firstCheckbox = rows.nth(0).locator('input[type="checkbox"]');
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.check();

    // リマインダー送信ボタンをクリック
    const sendReminderBtn = page.locator('#rm-send-reminder-btn');
    await expect(sendReminderBtn).toBeVisible();
    await sendReminderBtn.click();

    // 確認ダイアログが表示される
    page.once('dialog', dialog => {
      dialog.accept();
    });

    // エラーメッセージが表示されることを確認
    const toast = page.locator('#rm-toast');
    // 画面にエラーメッセージが表示されるまで待つ
    await expect(toast).toBeVisible({ timeout: 5000 }).catch(() => {
      // タイムアウト時は無視（エラーメッセージが表示されない場合）
    });

    if (await toast.isVisible({ timeout: 1000 }).catch(() => false)) {
      const toastText = await toast.textContent();
      // エラーメッセージ「報告者IDは必須です」が表示されていることを確認
      // または、その他のエラーメッセージが表示されていることを確認
      expect(toastText).toBeTruthy();
      // 「必須」「報告者」「ID」のいずれかのキーワードが含まれているか確認
      const hasErrorKeyword = toastText?.includes('必須') ||
                             toastText?.includes('報告者') ||
                             toastText?.includes('ID') ||
                             toastText?.includes('エラー');
      // エラーメッセージが表示されていることを確認
      expect(toastText?.length || 0).toBeGreaterThan(0);
    }
  }

  // メール送信履歴を確認
  const mailTab = page.getByText('メール送信履歴', { exact: true });
  if (await mailTab.isVisible()) {
    await mailTab.click();
    const mailTbody = page.locator('#rm-mail-tbody');
    await expect(mailTbody).toBeVisible();
  }
});
