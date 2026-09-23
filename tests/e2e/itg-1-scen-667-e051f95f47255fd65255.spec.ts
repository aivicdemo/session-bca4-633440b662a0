import { test, expect, type Page } from '@playwright/test';

// SCEN-667: 報告者情報が不正または空の場合、検知ログ画面に「報告者情報が不正です。管理者に確認してください」
// エラーメッセージが表示される。
//
// panels/scr-1790147095974.html の検知ログタブ（#rm-log-tbody）は AIVIC_PAGE_INIT_JS 内にハードコードされた
// logs 配列（3件、報告者名は常に非空）を描画するのみで、reporter_id が null／reporter_name が空文字列の
// 検知ログレコードをテスト用DBに投入する手段も、それを画面に反映する仕組みも存在しない。詳細表示
// （#rm-view-modal、詳細ボタン押下時に開く）にも報告者情報のバリデーションは実装されておらず、画面上部に
// エラーメッセージを表示する要素も存在しない。詳細設計上、最も近い概念は
// daily-report-non-submission-detection.ts / daily-report-management-view.ts のエラー
// （例："報告者情報が不完全または形式が不正です。必須項目を確認してください。"）だが、文言が仕様の期待結果
// 「報告者情報が不正です。管理者に確認してください」と一致しない。この食い違いは
// .aivic/batches/15/unresolved.md に記録する。本テストは仕様の手順・期待結果の文言に忠実に検証を記述する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('報告者情報が不正または空の場合、検知ログ画面にエラーメッセージが表示される', async ({ page }) => {
  // 管理者アカウントで日報確認・管理画面にログインする。
  await login(page, 'admin_scen667');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 検知ログ確認機能を開く（検知ログデータベースに報告者情報が空・nullのレコードが存在する前提）。
  await page.locator('.rm-tab[data-tab="log"]').click();
  const logRows = page.locator('#rm-log-tbody tr:not(.rm-empty-row)');
  await expect(logRows.first()).toBeVisible();

  // その検知ログレコードに対応するログエントリを検索または一覧から選択し、詳細表示を実行する。
  await logRows.first().locator('.rm-detail-btn').click();

  // 検知ログ画面に「報告者情報が不正です。管理者に確認してください」というエラーメッセージが画面上部に
  // 表示される。
  await expect(page.getByText('報告者情報が不正です。管理者に確認してください')).toBeVisible();

  // 画面の他の要素は操作可能なままで、エラーメッセージのみが視認される。
  await expect(page.locator('.rm-tab[data-tab="reminder"]')).toBeEnabled();
});
