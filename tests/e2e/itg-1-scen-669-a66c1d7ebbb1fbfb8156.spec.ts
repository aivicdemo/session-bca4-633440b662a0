import { test, expect, type Page } from '@playwright/test';

// SCEN-669: 日報データベースが一時的に取得できない場合、検知ログ画面に「日報データを取得できません。しばらく待ってから再度確認してください」警告メッセージが表示される

test('日報データベース取得失敗時に警告メッセージが表示される', async ({ page }) => {
  // 手順1: テスト環境で日報確認・管理画面にアクセスし、ログイン完了状態とする
  await page.goto('/panels/scr-1790147095974.html');

  // 手順2: 検知ログ確認機能へ遷移する
  const logTab = page.locator('.rm-tab[data-tab="log"]');
  await logTab.click();

  // 検知ログパネルが表示される
  const logPanel = page.locator('[data-panel="log"]');
  await expect(logPanel).toHaveClass(/is-active/);

  // 手順3: 検索・更新ボタンを操作し、ログデータ取得をトリガー
  // （ここでは画面のタブ切り替えでデータ取得がトリガーされると想定）

  // 手順4: 日報データベースが一時的に取得できない状態で、画面に表示されるメッセージを確認する

  // 期待結果: 警告メッセージが表示される
  // 「日報データを取得できません。しばらく待ってから再度確認してください」
  const warningMessage = page.locator('text=日報データを取得できません。しばらく待ってから再度確認してください');

  // 警告メッセージが存在することを確認
  await expect(warningMessage).toBeVisible({ timeout: 5000 });

  // 既存のログデータ（あれば）は残存したまま表示されるか、またはログ一覧エリアが空白のまま警告メッセージのみが表示される
  const logTable = logPanel.locator('#rm-log-tbody');
  const emptyMessage = logTable.locator('text=検知ログはありません');

  // ログテーブルが空（またはメッセージが表示されている）ことを確認
  const logRows = logTable.locator('tr:not(.rm-empty-row)');
  const hasEmptyState = (await emptyMessage.isVisible()).valueOf() || (await logRows.count()) === 0;

  expect(hasEmptyState).toBe(true);
});
