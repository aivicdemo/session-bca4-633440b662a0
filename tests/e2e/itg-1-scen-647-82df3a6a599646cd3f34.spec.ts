import { test, expect, type Page } from '@playwright/test';

// SCEN-647: 未提出者が検知されたとき、リーダーへ未提出者一覧と催促内容をメール通知で送信する。
//
// 手順「定時自動検知処理をトリガーする（本テスト環境では手動実行ボタンを押下、または検知スケジューラを実行）」
// について、panels/scr-1790147095974.html には検知処理を手動実行するボタン等は存在しない。本テストは実在する
// 「未提出者・リマインダー」タブおよび「検知ログ」タブを開くことでこの手順に代替する。
//
// 期待結果について、実際の画面には以下の食い違いがある（.aivic/batches/11/unresolved.md に記録）。
// (1) #rm-missing-tbody の各行に「催促ステータス情報（例：『催促メール送信完了』、送信日時タイムスタンプ）」は
//     列としては『最終リマインダー送信日時』のみで、「催促メール送信完了」という文言そのものは表示されない。
// (2) 「検知ログ・メール送信履歴」に、送信者（システム）というフィールドは存在しない
//     （#rm-mail-tbody の列は送信日時・メールタイプ・送信先・件名・ステータスのみ）。
// (3) メール送信履歴の件名（例：「【日報】本日分の提出をお願いします」）には「未提出者一覧」という文字列は
//     含まれていない。
// 本テストは仕様の期待結果の文言に忠実に、これらの内容を検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('未提出者検知後、リーダーへの催促メール送信内容が管理画面と送信履歴に反映される', async ({ page }) => {
  // 日報確認・管理画面へログインする（リーダー権限ユーザー）。
  await login(page, 'leader_scen647');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 定時自動検知処理のトリガーに相当する操作として、未提出者一覧パネルを確認する。
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  const missingRows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(missingRows.first()).toBeVisible();

  // (1) 未提出者一覧に、検知対象の未提出ユーザーが表示される。
  const missingCount = await missingRows.count();
  expect(missingCount).toBeGreaterThan(0);

  // (2) 各未提出者の行に催促ステータス情報（催促メール送信完了、送信日時タイムスタンプ）が表示される。
  for (let i = 0; i < missingCount; i++) {
    await expect(missingRows.nth(i)).toContainText('催促メール送信完了');
  }

  // 管理画面内の「メール送信履歴」セクションを開く。
  await page.locator('.rm-tab[data-tab="mail"]').click();
  const mailRows = page.locator('#rm-mail-tbody tr:not(.rm-empty-row)');
  await expect(mailRows.first()).toBeVisible();

  // (3) 検知ログ・メール送信履歴に、送信日時・送信者（システム）・受信者（リーダー）・
  //     件名に「未提出者一覧」を含む・本文に未提出ユーザー名と催促内容を含む旨のレコードが記録されている。
  const subjectCells = mailRows.locator('td').nth(3);
  await expect(subjectCells.filter({ hasText: '未提出者一覧' }).first()).toBeVisible();
  await expect(page.getByText('送信者')).toBeVisible();
  await expect(page.getByText('システム')).toBeVisible();

  // (4) 画面上にエラーメッセージ（「通知送信失敗」など）は表示されない。
  await expect(page.getByText('通知送信失敗')).toHaveCount(0);
});
