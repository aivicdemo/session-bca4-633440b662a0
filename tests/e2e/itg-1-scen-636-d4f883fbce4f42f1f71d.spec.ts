import { test, expect, type Page } from '@playwright/test';

// SCEN-636: 日報が報告者の氏名を表示される
//
// panels/scr-1790147087109.html の提出ボタン（#rp-submit-btn）押下時の処理は、送信中スピナー表示・完了メッセージ
// 表示・フォームリセットのみを行う setTimeout ベースの疑似処理であり、aivicApi.save 等を用いて「日報」テーブルへ
// レコードを保存することはない。また panels/scr-1790147095974.html の「提出済み日報」一覧（reports）は
// AIVIC_PAGE_INIT_JS 内にハードコードされた固定のモック配列であり、window.AIVIC_TABLES から取得した実際の
// レコードや、ログイン中のユーザー名とは一切連携しない。そのためテストユーザーとして日報を提出しても、
// 管理画面の一覧にその日報（および氏名）が新たに現れることはない。ログイン画面（login.html）はどの入力でも
// ログイン可能であり、ログイン後のユーザー名表示（.user-name）も "ユーザー" という固定文字列で、ログイン時の
// ユーザー名を反映しない。本テストは仕様の手順どおりに提出操作を行い、ユーザーマスタ（window.AIVIC_PRESET_SEED の
// 「ユーザー」テーブル）に登録されている氏名「山田太郎」でログインしたうえで、管理画面の報告者名フィルタで
// 該当行を検索し詳細画面の氏名表示を検証する形で記述したが、現状のサンプル実装では一覧に該当行が現れず
// 成立しない可能性が高い。詳細は .aivic/batches/9/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('日報が報告者の氏名を表示される', async ({ page }) => {
  const reporterName = '山田太郎';

  // テストユーザー（報告者）として日報入力・提出画面にログインする
  await login(page, reporterName);

  // 日報内容（今日何をしたか）を入力欄に記入する
  const textarea = page.locator('#rp-content');
  await textarea.fill('本日はSCEN-636確認用の日報内容をテスト目的で記入しました。');

  // 妥当性チェックを経て提出ボタンをクリックする
  await expect(page.locator('#rp-validation')).toHaveClass(/is-ok/);
  const submitBtn = page.locator('#rp-submit-btn');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // 提出完了後、日報確認・管理画面に遷移する
  await expect(page.locator('#rp-success')).toBeVisible();
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);
  const reportsTab = page.locator('.rm-tab[data-tab="reports"]');
  await expect(reportsTab).toHaveClass(/is-active/);

  // 提出済み日報の一覧から、当該日報をクリックして詳細を開く
  await page.locator('#rm-r-name').fill(reporterName);
  const targetRow = page.locator('#rm-r-tbody tr').first();
  await expect(targetRow).toBeVisible();
  await targetRow.locator('.rm-detail-btn').click();
  await expect(page.locator('#rm-view-modal')).toHaveClass(/is-visible/);

  // 日報詳細画面に表示される報告者情報を確認する
  // 日報詳細画面の報告者情報欄に、提出したテストユーザーの氏名が正確に表示されていること。
  // 表示される氏名は、ユーザーマスタに登録されている報告者の氏名と一致していること。
  await expect(page.locator('#rm-view-modal-title')).toContainText(reporterName);
});
