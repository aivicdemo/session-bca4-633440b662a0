import { test, expect } from '@playwright/test';

// SCEN-620: ユーザーIDが空または null である場合、ユーザー認証に失敗して例外が発生する。
// 手順にログイン操作が含まれないため、未認証（ユーザーIDが空/null）の状態のまま画面へアクセスする。

test('ユーザーIDが空またはnullの状態で送信履歴を検索・表示すると、ユーザー認証エラーが表示される', async ({ page }) => {
  // 手順1: 日報確認・管理画面にアクセスする（ログインしていないため、ユーザーIDは空/null）。
  await page.goto('/panels/scr-1790147095974.html');

  const reportsPanel = page.locator('.rm-panel[data-panel="reports"]');
  await expect(reportsPanel).toHaveClass(/is-active/);

  // 手順2: メール送信履歴確認機能を開く。
  // 手順3: ユーザーIDが空または null の状態で送信履歴の検索・表示処理を実行する。
  await page.locator('.rm-tab[data-tab="mail"]').click();

  // 手順4: 画面の挙動とエラー表示を確認する。
  // 期待結果: 「ユーザー認証に失敗しました」というエラーメッセージが表示され、メール送信履歴一覧は表示されず、
  // 画面は送信履歴確認前の状態に戻る。
  await expect(page.getByText('ユーザー認証に失敗しました')).toBeVisible();
  await expect(page.locator('#rm-mail-tbody tr:not(.rm-empty-row)')).toHaveCount(0);
  await expect(reportsPanel).toHaveClass(/is-active/);
});
