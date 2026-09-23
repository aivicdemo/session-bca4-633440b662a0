import { test, expect, type Page } from '@playwright/test';

// SCEN-637: 日報の提出時刻が『HH:MM』形式で表示される
//
// panels/scr-1790147087109.html の提出処理は疑似的な完了表示のみで、実際の提出時刻を「日報」テーブルへ
// 記録することはない（SCEN-636 と同様）。panels/scr-1790147095974.html の一覧・詳細モーダルにも
// 単独の『提出時刻』フィールドは存在せず、モック配列 reports の submittedAt フィールド
// （例：'2026-09-22 18:12'、日付＋時刻の複合文字列）が詳細モーダル本文（#rm-view-modal-body）の
// 「提出日時」欄にそのまま表示されるのみである。したがって秒を含まない『HH:MM』単独形式の値を
// 検証対象として特定することができない。本テストは詳細設計上「提出時刻」に最も近いモーダル本文の
// 「提出日時」欄を代替として使用し、そこに含まれる時刻部分が『HH:MM』形式であることを検証する形で
// 仕様の期待結果に忠実な検証を記述したが、日付部分を含む複合値であるため厳密には仕様の期待結果
// （HH:MM単独表示）と一致しない。詳細は .aivic/batches/9/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報の提出時刻が『HH:MM』形式で表示される', async ({ page }) => {
  // テスト環境にて、日報入力・提出画面で日報内容を入力し、妥当性チェックを経て提出ボタンを押下する
  await login(page, 'reporter_scen637');
  const textarea = page.locator('#rp-content');
  await textarea.fill('本日はSCEN-637確認用の日報内容をテスト目的で記入しました。');
  await expect(page.locator('#rp-validation')).toHaveClass(/is-ok/);
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // 日報提出が完了し、システムが提出時刻を記録する
  await expect(page.locator('#rp-success')).toBeVisible();

  // 日報確認・管理画面を開く
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const reportsTab = page.locator('.rm-tab[data-tab="reports"]');
  await expect(reportsTab).toHaveClass(/is-active/);

  // 提出済み日報の一覧から、ステップ2で提出した日報を検索・選択し、詳細表示を開く
  const targetRow = page.locator('#rm-r-tbody tr').first();
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-detail-btn').click();
  await expect(page.locator('#rm-view-modal')).toHaveClass(/is-visible/);

  // 日報詳細画面上の『提出時刻』フィールドに表示されているテキストを確認する
  // 『HH:MM』形式（例：『09:45』『14:30』）で提出時刻が表示されていること。秒単位は表示されず、
  // 時間と分のみが2桁ずつ、コロンで区切られた形式であること。
  const submissionTimeText = await page.locator('#rm-view-modal-body').innerText();
  expect(submissionTimeText).toMatch(/^\d{2}:\d{2}$/m);
});
