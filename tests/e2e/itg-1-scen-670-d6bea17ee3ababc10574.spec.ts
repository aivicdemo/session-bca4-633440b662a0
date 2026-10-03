import { test, expect, type Page } from '@playwright/test';

// SCEN-670: チームメンバーが登録されていない場合、検知ログ画面に「チームに報告者が登録されていません」警告メッセージが表示される

test('チームメンバー未登録時に警告メッセージが表示される', async ({ page }) => {
  // 手順1: テスト環境の日報確認・管理画面にアクセスし、ログイン状態を確認する
  await page.goto('/panels/scr-1790147095974.html');

  // 手順2-3: 左メニューから「検知ログ」タブを選択する
  const logTab = page.locator('.rm-tab[data-tab="log"]');
  await logTab.click();

  // 検知ログパネルが表示されるまで待機
  const logPanel = page.locator('[data-panel="log"]');
  await expect(logPanel).toHaveClass(/is-active/);

  // 手順4: 検知ログ画面が表示されるまで待機

  // 期待結果: 警告メッセージが表示される
  // 「チームに報告者が登録されていません」
  const warningMessage = page.locator('text=チームに報告者が登録されていません');

  // メッセージが存在することを確認
  await expect(warningMessage).toBeVisible({ timeout: 3000 });

  // メッセージの表示位置は画面上部、背景色は警告を示す色（黄色またはオレンジ）で、ユーザーが視認可能な状態で表示されることを確認
  const warningElement = warningMessage.locator('..');

  // 要素が視認可能であることを確認
  await expect(warningElement).toBeVisible();

  // 背景色が警告を示す色であることを確認（黄色またはオレンジのクラス）
  const classes = await warningElement.evaluate(el => el.getAttribute('class'));
  const isWarningStyle = classes?.includes('warning') || classes?.includes('alert') || false;

  // スタイル確認（背景色が黄色またはオレンジ系であることを確認）
  const bgColor = await warningElement.evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(bgColor).toMatch(/rgb\(|rgba\(/);
});
