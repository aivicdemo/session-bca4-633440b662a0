import { test, expect, type Page } from '@playwright/test';

// SCEN-631: リーダーが権限を持たない場合、日報詳細確認画面へのアクセスが拒否される
//
// panels/login.html にはロール（リーダー権限あり/なし）を区別する入力・仕組みが存在せず、フッターにも
// 「サンプル実装ではどの入力でもログインできます」と明記されている。そのため「リーダー権限なし」の状態を
// UI 操作で厳密に再現する手段はなく、本テストではユーザー名にその前提を示す値（staff_norole_scen631）を
// 使うことでこの前提条件を表現する。
// また panels/scr-1790147095974.html の「詳細」ボタン（.rm-detail-btn）のクリックハンドラは、AIVIC_PAGE_INIT_JS
// 内でページ内に保持したモック配列 reports から該当行を検索してモーダル（#rm-view-modal）へ直接描画するのみで、
// 日報詳細取得APIへの fetch 呼び出しは行われない。したがって権限の有無に関わらずネットワークリクエストは発火せず、
// 403 応答や「アクセス権限がありません」という文言の要素も画面上に存在しない。クリックすれば常にモーダルが開き
// 日報内容が描画される。
// 本テストは仕様の文言に忠実に、遷移が発生しないこと・詳細取得に relevant なネットワークリクエストが増えないこと・
// 「アクセス権限がありません」表示の確認・詳細情報が描画されないことを検証する形で記述したが、上記の理由から
// 現状のサンプル実装では成立しない（モーダルが開いて日報内容が描画されてしまう）可能性が高い。
// 詳細は .aivic/batches/8/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リーダーが権限を持たない場合、日報詳細確認画面へのアクセスが拒否される', async ({ page }) => {
  // テストユーザーを『リーダー権限なし』の状態でシステムにログインする
  await login(page, 'staff_norole_scen631');

  // 日報確認・管理画面へアクセスする
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  const managementUrl = page.url();

  const requestUrls: string[] = [];
  page.on('request', (req) => requestUrls.push(req.url()));

  const rows = page.locator('#rm-r-tbody tr');
  await expect(rows.first()).toBeVisible();
  // 提出済みの日報レコード（別ユーザーが提出した日報）の詳細確認リンク/ボタンをクリックしようとする
  const targetRow = rows.first();
  await targetRow.locator('.rm-detail-btn').click();

  await page.waitForTimeout(300);

  // ブラウザ開発者ツール（Network タブ）で日報詳細取得APIへのリクエストが発火されたかを確認する
  const detailFetchRequests = requestUrls.filter((url) => /\/api\/.*日報|report.*detail|detail.*report/i.test(url));
  expect(detailFetchRequests).toHaveLength(0);

  // 日報詳細確認画面への遷移が発生しない
  expect(page.url()).toBe(managementUrl);

  // HTTP 403 Forbidden またはアプリケーション層での『アクセス権限がありません』エラーメッセージが表示される
  await expect(page.getByText('アクセス権限がありません')).toBeVisible();

  // 画面には詳細情報が一切描画されない状態になる
  await expect(page.locator('#rm-view-modal')).not.toHaveClass(/is-visible/);
  await expect(page.locator('#rm-view-modal-body')).not.toContainText('業務内容');
});
