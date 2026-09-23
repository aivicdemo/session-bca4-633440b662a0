import { test, expect, type Page } from '@playwright/test';

// SCEN-633: 報告者のアカウントが無効である場合、日報詳細確認画面でアクセス拒否と表示される
//
// 「ユーザーマスタから対象の報告者アカウントを無効状態に設定する」という前提操作を行うための管理UI・APIは
// panels/scr-1790147095974.html 上に存在しない。window.AIVIC_PRESET_SEED の「ユーザー」テーブルには
// ステータス「無効」のレコード（田中太郎）が含まれているが、日報一覧（reports）はこのユーザーマスタと連携しない
// 固定のモック配列であり、報告者のアカウント状態と日報詳細表示は紐付いていない。詳細確認ボタン
// （.rm-detail-btn）押下時の openViewModal 処理はアカウント有効性の検証を一切行わずにモーダルを表示するため、
// 「アクセス拒否：報告者のアカウントが無効です」という文言も画面上に実装されていない。本テストは一覧の先頭行を
// 「無効状態の報告者が提出した日報」の代替として選択し、仕様の期待結果の文言に忠実な検証を記述したが、
// 現状のサンプル実装では成立しない可能性が高い。詳細は .aivic/batches/9/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者のアカウントが無効である場合、日報詳細確認画面でアクセス拒否と表示される', async ({ page }) => {
  // テスト管理者として日報管理システムにログインする
  await login(page, 'admin_scen633');

  // （ユーザーマスタから対象の報告者アカウントを無効状態に設定する操作に相当するUIは存在しないため、
  //   既存のモック日報一覧をそのまま無効状態の報告者の日報として扱う）

  // 日報確認・管理画面を開く
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const reportsTab = page.locator('.rm-tab[data-tab="reports"]');
  await expect(reportsTab).toHaveClass(/is-active/);

  // 無効状態の報告者が提出した日報のレコードを特定し、当該日報の詳細確認をクリックする
  const targetRow = page.locator('#rm-r-tbody tr').first();
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-detail-btn').click();

  // 日報詳細確認画面遷移時に、画面上部に「アクセス拒否：報告者のアカウントが無効です」というメッセージが表示される
  await expect(page.getByText('アクセス拒否：報告者のアカウントが無効です')).toBeVisible();

  // 日報の詳細情報（入力内容）は表示されず、画面は入力不可状態となる
  await expect(page.locator('#rm-view-modal-body')).not.toBeVisible();
});
