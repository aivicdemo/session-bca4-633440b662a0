import { test, expect, type Page } from '@playwright/test';

// SCEN-681: チームリーダー以外のユーザーがリマインダー設定管理画面にアクセスしようとすると、アクセスが拒否される
//
// login.html はフッターに「サンプル実装ではどの入力でもログインできます」と明記されており、ユーザーの役割
// （チームリーダー／一般報告者）を区別する仕組みが存在しない。panels/scr-1790147087109.html・
// panels/scr-1790147095974.html のいずれにも、詳細設計（user-authentication-authorization.ts の
// authenticateAndAuthorizeLeaderAccess / validateUserHasLeaderRole）が定義する役割ベースのアクセス制御は
// 実装されておらず、ログイン済みであればどのユーザーでも管理画面全体・リマインダー設定管理ボタン
// （#rm-settings-btn）に無条件でアクセスできる。また #rm-settings-btn のクリックはモーダルを開くローカルな
// DOM操作のみで、ネットワークリクエストを一切発生させないため、「HTTPステータスコード403/401」を観測する
// 手段も存在しない。この食い違いは .aivic/batches/18/unresolved.md に記録し、本テストは仕様の期待結果の
// 文言どおりに検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('チームリーダー以外のユーザーがリマインダー設定管理画面にアクセスしようとすると、アクセスが拒否される', async ({
  page,
}) => {
  // 手順1/2: テスト用ブラウザセッションを開き、チームリーダー以外のユーザー（一般報告者）でログインする
  await login(page, 'reporter_norole_scen681');

  // 手順3: ログイン後、日報確認・管理画面へ遷移する
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // レスポンスステータスコードを確認できるようにネットワークレスポンスを監視する
  const responseStatuses: number[] = [];
  page.on('response', (res) => responseStatuses.push(res.status()));

  // 手順4: 日報確認・管理画面内のリマインダー設定管理機能・ボタン・メニュー項目へアクセスを試行する
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  await page.locator('#rm-settings-btn').click();
  await page.waitForTimeout(300);

  // 手順5: HTTPレスポンスステータスコード（401/403）を確認する
  const deniedStatuses = responseStatuses.filter((status) => status === 401 || status === 403);
  expect(deniedStatuses.length).toBeGreaterThan(0);

  // 期待結果: リマインダー設定管理画面が表示されない
  await expect(page.locator('#rm-settings-modal')).not.toHaveClass(/is-visible/);

  // 期待結果: 「アクセス権限がありません」または「このページへのアクセスは制限されています」というエラーメッセージが表示される
  await expect(
    page.getByText(/アクセス権限がありません|このページへのアクセスは制限されています/)
  ).toBeVisible();

  // 期待結果: 日報確認・管理画面の他の機能（提出済み日報の確認・閲覧など）へのアクセスは可能な状態のままである
  await page.locator('.rm-tab[data-tab="reports"]').click();
  await expect(page.locator('#rm-r-tbody tr').first()).toBeVisible();
});
