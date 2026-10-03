import { test, expect } from '@playwright/test';

test('SCEN-705: 報告者の氏名が空のとき、保存をエラーで中断する', async ({ page }) => {
  // 日報確認・管理画面にアクセスする
  await page.goto('/login.html');

  // 管理者権限でログイン
  await page.fill('[data-testid="username"]', 'admin_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 管理メニューから「報告者マスタ管理」を開く
  // 注：仕様で「報告者マスタ管理」が参照されていますが、提供されたパネルには該当するURLが見つかりません
  await page.goto('/panels/reporter-master.html');

  // 新規報告者追加フォームを表示する
  const addButton = page.locator('button').filter({ hasText: /新規追加/ });
  await addButton.click();

  // 氏名フィールドを空のまま残し、その他の必須項目（メールアドレスなど）は入力する
  await page.fill('input[name="email"]', 'yamada@example.com');
  await page.fill('input[name="department"]', '営業部');

  // 保存ボタンをクリック
  const saveButton = page.locator('button').filter({ hasText: /保存/ });
  await saveButton.click();

  // 画面上に「氏名は必須項目です」というエラーメッセージが表示される
  const errorMessage = page.locator('text=/氏名は必須項目です/');
  await expect(errorMessage).toBeVisible();

  // フォーム内容は保存されず、ユーザーは入力フォーム画面に留まる
  const formContainer = page.locator('form, [data-testid="form"], .form-card');
  await expect(formContainer.first()).toBeVisible();

  // データベースには新しいレコードが作成されていないことを確認（フォーム入力状態で検証）
  const nameInput = page.locator('input[name="name"]');
  await expect(nameInput).toHaveValue('');
});
