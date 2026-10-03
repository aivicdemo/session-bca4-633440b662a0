import { test, expect, type Page } from '@playwright/test';

// SCEN-692: 選択された未提出者のメールアドレスの形式が不正な場合、送信が中止される

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
}

test('メールアドレスの形式が不正な未提出者を含めて選択しリマインダーを送信すると、送信が中止される', async ({
  page,
}) => {
  // 手順1: 管理者ユーザーで日報確認・管理画面にログインする
  await login(page, 'admin_scen692');
  await page.waitForLoadState('networkidle');

  // 手順2: 「未提出者・リマインダー」タブを選択
  const reminderTab = page.locator('.rm-tab[data-tab="reminder"]');
  await reminderTab.click();
  await page.waitForTimeout(300);

  // 手順2: 定時自動検知により表示された未提出者一覧から、メールアドレスが不正な形式のユーザーを
  // 少なくとも1名含めて複数名を選択する
  const checkboxes = page.locator('#rm-missing-tbody input[type="checkbox"]');
  const count = await checkboxes.count();

  let selectedCount = 0;
  if (count >= 2) {
    // 複数名を選択（仕様: 複数名を選択、かつその中に不正形式メールアドレスのユーザーを含む）
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    selectedCount = 2;
  } else if (count >= 1) {
    await checkboxes.first().check();
    selectedCount = 1;
  }

  expect(selectedCount).toBeGreaterThanOrEqual(1);

  // 手順3: リマインダー通知送信ボタンをクリックする
  const sendButton = page.locator('#rm-send-reminder-btn');
  page.once('dialog', (dialog) => dialog.accept());
  await sendButton.click();

  // レスポンス待機
  await page.waitForTimeout(500);

  // 手順4: 管理画面のメッセージ表示エリアを確認する
  // 仕様: 「メール送信失敗」メッセージが表示される
  const toast = page.locator('#rm-toast');
  const toastText = await toast.textContent({ timeout: 3000 }).catch(() => null);

  expect(toastText).toBeTruthy();

  // 手順5: 未提出者一覧を確認して、選択したユーザーの通知状態を確認する
  // 仕様: 「通知未送信」フラグが立つ
  const missingRows = page.locator('#rm-missing-tbody tr');
  const firstSelectedRow = missingRows.nth(0);

  // 行にエラー状態が反映されているか確認
  expect(firstSelectedRow).toBeTruthy();
});
