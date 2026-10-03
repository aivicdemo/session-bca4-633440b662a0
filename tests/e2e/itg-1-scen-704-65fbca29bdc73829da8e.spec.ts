import { test, expect } from '@playwright/test';

test('SCEN-704: チームリーダーが権限なしの場合、報告者マスタ保存を中断する', async ({ page }) => {
  // 日報確認・管理画面にアクセスし、チームリーダー権限を持つユーザーでログインする
  await page.goto('/login.html');

  // チームリーダー権限でログイン
  await page.fill('[data-testid="username"]', 'team_leader_user');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();

  // 画面のメニューから「報告者マスタ管理」機能を開く
  // 報告者マスタ管理に対応するパネルURLへナビゲート
  // 注：仕様で「報告者マスタ管理」が参照されていますが、提供されたパネルには該当するURLが見つかりません
  // テストは報告者マスタ管理画面が panels/*.html で提供されることを前提としています
  await page.goto('/panels/reporter-master.html');

  // 報告者マスタ一覧画面で新規報告者追加フォームを開く
  const addButton = page.locator('button').filter({ hasText: /新規追加/ }).first();
  await addButton.click();

  // 報告者情報（氏名、所属等）を入力する
  await page.fill('input[name="name"]', '山田太郎');
  await page.fill('input[name="email"]', 'yamada@example.com');
  await page.fill('input[name="department"]', '営業部');

  // 保存ボタンをクリックする
  const saveButton = page.locator('button').filter({ hasText: /保存/ });
  await saveButton.click();

  // 保存ボタンクリック後、画面に「権限がないため報告者マスタの保存はできません」というエラーメッセージが表示される
  const errorMessage = page.locator('text=/権限がないため報告者マスタの保存はできません/');
  await expect(errorMessage).toBeVisible();

  // 入力済みのフォーム内容は保持されたままであることを確認
  await expect(page.locator('input[name="name"]')).toHaveValue('山田太郎');

  // 画面の遷移は発生しないことを確認（報告者マスタ管理画面に留まる）
  expect(page.url()).toContain('/panels/reporter-master.html');
});
