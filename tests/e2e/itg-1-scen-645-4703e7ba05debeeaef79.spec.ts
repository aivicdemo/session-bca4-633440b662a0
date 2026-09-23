import { test, expect, type Page } from '@playwright/test';

// SCEN-645: 未提出者が検知されたとき、報告者ID・名前・最後の提出日時を含む一覧が管理画面に表示される。
//
// 手順「未提出者検知の定時実行をシミュレートするため、システム管理者権限でトリガーボタン（または検知スケジューラー
// 実行コマンド）を操作する」について、panels/scr-1790147095974.html には検知処理を手動実行するトリガーボタンや
// スケジューラー実行コマンドに相当する UI 要素は存在しない（ui-reference.md の buttonTexts にも該当ボタンはない）。
// 「未提出者・リマインダー」タブの一覧はハードコードされたモック配列であり、画面を更新しても内容は変化しない。
// 本テストは、実在する「未提出者・リマインダー」タブを開くことでこの手順に代替し、以降の検証を実際に表示される
// 一覧に対して行う。
//
// 期待結果「報告者ID（ユーザーマスタの主キー値）」「最後の提出日時（ISO 8601形式等）」を含む行について、実際の
// #rm-missing-tbody の列はチェックボックス・報告者名・対象日付・最終リマインダー送信日時の4列のみで、
// 「報告者ID」列も「最後の提出日時」列（提出済みでない報告者の最後の提出日時を示す列）も存在しない
// （対象日付は未提出対象日、最終リマインダー送信日時は催促送信日時であり、いずれも「最後の提出日時」とは意味が
// 異なる）。この食い違いは .aivic/batches/11/unresolved.md に記録し、本テストでは実在する列（報告者名）と
// 各行が独立して区別されることのみを検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('未提出者検知後、管理画面の未提出者一覧に各未提出者が独立した行として表示される', async ({ page }) => {
  // テスト環境にログインし、日報確認・管理画面を開く。
  await login(page, 'leader_scen645');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 未提出者検知の定時実行に相当する操作として、未提出者・リマインダータブを開き検知結果を表示する。
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  // 画面を更新し、「未提出者一覧」セクションを確認する。
  await page.reload();
  await page.locator('.rm-tab[data-tab="reminder"]').click();

  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows.first()).toBeVisible();
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 複数の未提出者が存在する場合、各々が独立した行として区別されることを確認する（報告者名が重複しない）。
  const names = await rows.evaluateAll((trs) =>
    trs.map((tr) => tr.querySelectorAll('td')[1]?.textContent?.trim() ?? ''),
  );
  expect(names.every((n) => n.length > 0)).toBe(true);
  expect(new Set(names).size).toBe(names.length);
});
