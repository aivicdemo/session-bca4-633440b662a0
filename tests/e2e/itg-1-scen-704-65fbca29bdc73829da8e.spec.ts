import { test, expect, type Page } from '@playwright/test';

// SCEN-704: チームリーダーが権限なしの場合、報告者マスタ保存を中断する
//
// panels/scr-1790147095974.html（日報確認・管理画面）には「報告者マスタ管理」という
// メニュー項目・新規報告者追加フォーム・保存ボタンが存在しない（タブは「提出済み日報」
// 「未提出者・リマインダー」「検知ログ」「メール送信履歴」の4つのみ）。また login.html は
// 入力値に関わらずログインできる作りで、権限（役割）の判定を行っていない。詳細設計
// （user-authentication-authorization.ts の authenticateAndAuthorizeLeaderAccess）には
// 「チームリーダーの認証と報告者マスタ管理権限を確認し、権限なしの場合は処理を中断する」
// という責務が定義されているが、対応するUIは存在しない。本テストは仕様の期待結果を
// 弱めずに、仕様の文言（メニュー名・入力ラベル・ボタン名・エラーメッセージ）に忠実な
// 操作・検証をそのまま実装したが、現状のサンプル実装では該当要素が見つからない可能性が
// 高い。詳細は .aivic/batches/24/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('チームリーダーが権限なしの場合、報告者マスタ保存を中断する', async ({ page }) => {
  // 手順1: 日報確認・管理画面にアクセスし、チームリーダー権限を持つユーザーでログインする
  await login(page, 'leader_no_permission_scen704');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順2: 画面のメニューから「報告者マスタ管理」機能を開く
  await page.getByText('報告者マスタ管理').click();

  // 手順3: 報告者マスタ一覧画面で新規報告者追加フォームを開く
  await page.getByRole('button', { name: '新規追加' }).click();

  // 手順4: 報告者情報（氏名、所属等）を入力する
  const nameInput = page.getByLabel('氏名');
  const departmentInput = page.getByLabel('所属');
  await nameInput.fill('鈴木一郎');
  await departmentInput.fill('営業部');

  // 手順5: 保存ボタンをクリックする
  await page.getByRole('button', { name: '保存' }).click();

  // 期待結果: 「権限がないため報告者マスタの保存はできません」というエラーメッセージが表示され、
  // 入力済みのフォーム内容は保持されたまま、画面の遷移は発生しない。
  await expect(page.getByText('権限がないため報告者マスタの保存はできません')).toBeVisible();
  await expect(nameInput).toHaveValue('鈴木一郎');
  await expect(departmentInput).toHaveValue('営業部');
  await expect(page).toHaveURL(/panels\/scr-1790147095974\.html/);
});
