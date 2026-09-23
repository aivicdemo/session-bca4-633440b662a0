import { test, expect, type Page } from '@playwright/test';

// SCEN-709: 新規報告者の情報が入力値どおりにマスタに登録される
//
// panels/scr-1790147095974.html には「報告者マスタ」メニュー項目・新規追加ボタン・
// 一覧画面・詳細表示のいずれも存在しない（.aivic/batches/24/unresolved.md 参照）。
// 本テストは仕様の手順・期待結果を弱めずに、仕様の文言どおりの操作・検証をそのまま
// 実装した。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('新規報告者の情報が入力値どおりにマスタに登録される', async ({ page }) => {
  const name = '山田太郎';
  const email = 'yamada.taro@example.com';

  // 手順1: 日報確認・管理画面にログインし、管理者権限で画面を表示する
  await login(page, 'admin_scen709');

  // 手順2: 画面上の「報告者マスタ」メニュー項目を選択し、報告者管理画面を開く
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('報告者マスタ', { exact: false }).click();

  // 手順3: 「新規追加」ボタンをクリックし、新規報告者入力フォームを表示する
  await page.getByRole('button', { name: '新規追加' }).click();

  // 手順4: 報告者名『山田太郎』、メールアドレス『yamada.taro@example.com』を入力する
  const nameInput = page.getByLabel('氏名');
  const emailInput = page.getByLabel('メールアドレス');
  await nameInput.fill(name);
  await emailInput.fill(email);

  // 手順5: エラーメッセージがないことを確認し、「保存」ボタンをクリックする
  await expect(page.getByText(/必須項目です|形式が正しくありません|既に登録されています/)).toHaveCount(0);
  await page.getByRole('button', { name: '保存' }).click();

  // 手順6: 保存処理が完了し、報告者マスタ一覧画面に遷移することを確認する
  const list = page.getByRole('table');
  await expect(list).toBeVisible();

  // 手順7: 一覧画面で新規追加した報告者『山田太郎』が表示されていることを確認する
  const newRow = page.getByRole('row', { name: new RegExp(name) });
  await expect(newRow).toBeVisible();

  // 手順8: 表示された新規報告者行を選択し、詳細表示または編集画面を開く
  await newRow.click();

  // 手順9/期待結果: 詳細画面で報告者名『山田太郎』、メールアドレス
  // 『yamada.taro@example.com』が表示されている。
  await expect(page.getByText(name)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});
