import { test, expect, type Page } from '@playwright/test';

// SCEN-660: 報告期限時刻が17時より前のとき、該当時刻に達するまで未提出者検知は実行されない。
//
// panels/scr-1790147095974.html の #rm-detect-status は window.AIVIC_PAGE_INIT_JS 内で
// `'最終検知: 2026-09-23 09:00'` という固定文字列を代入するだけであり、システム時刻や報告期限時刻（17時）を
// 判定するロジックは一切実装されていない。したがって Playwright の page.clock でブラウザ側の時刻を16時30分に
// 固定しても、この表示文字列は変化しない。「定時検知待機中」という状態表示文言も画面のどこにも存在しない
// （ui-reference.md の visibleTexts にも含まれていない）。また未提出者一覧（missing 配列）・メール送信履歴
// （mailHistory 配列）もハードコードされたモックデータであり、時刻に応じて検知記録が追加されたりリマインダーが
// 送信されたりする仕組みは存在しない。本テストは、システム時刻を16時30分に固定した上で画面をリロードし、期待
// 結果の文言どおりの検証（新たな未提出検知記録が追加されていない、「定時検知待機中」の表示、メール未送信）を
// 記述したが、現状のサンプル実装では「定時検知待機中」の表示は確認できない可能性が高い。詳細は
// .aivic/batches/13/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告期限時刻17時より前は未提出者検知が実行されず、定時検知待機中の状態が表示される', async ({ page }) => {
  // テスト環境のシステム時刻を報告期限時刻の17時より前（16時30分）に設定する
  await page.clock.install({ time: new Date('2026-09-23T16:30:00+09:00') });

  // 日報確認・管理画面にアクセスし、未提出者検知機能の状態を確認する
  await login(page, 'admin_scen660');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const missingCountBefore = await page.locator('#rm-missing-tbody tr:not(.rm-empty-row)').count();

  await page.getByText('メール送信履歴', { exact: true }).click();
  const mailCountBefore = await page.locator('#rm-mail-tbody tr:not(.rm-empty-row)').count();

  // 未提出者検知の定時実行トリガー（17時到達前のチェック処理）が自動実行されるのを待つ
  await page.clock.fastForward('00:20:00');

  // 日報確認・管理画面の未提出者一覧をリロードし、検知結果の表示状態を確認する
  await page.reload();
  await page.getByText('未提出者・リマインダー', { exact: true }).click();

  // システム時刻が報告期限時刻17時より前の状況では、未提出者一覧に新たな未提出検知記録が追加されていない
  const missingCountAfter = await page.locator('#rm-missing-tbody tr:not(.rm-empty-row)').count();
  expect(missingCountAfter).toBe(missingCountBefore);

  // 管理画面に「定時検知待機中」または同等の状態表示がされている
  await expect(page.locator('#rm-detect-status')).toHaveText(/定時検知待機中/);

  // メール通知（リマインダー）は送信されていない
  await page.getByText('メール送信履歴', { exact: true }).click();
  const mailCountAfter = await page.locator('#rm-mail-tbody tr:not(.rm-empty-row)').count();
  expect(mailCountAfter).toBe(mailCountBefore);
});
