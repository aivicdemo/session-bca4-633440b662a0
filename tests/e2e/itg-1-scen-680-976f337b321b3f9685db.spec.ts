import { test, expect, type Page } from '@playwright/test';

// SCEN-680: リマインダー設定の入力値が形式ルールに違反すると、保存が拒否されて入力エラーが表示される
//
// panels/scr-1790147095974.html のリマインダー設定管理モーダルでは、送信曜日は7個の曜日別チェックボックス
// （.rm-day-checkbox、data-day="月"〜"日"）で選択する方式であり、「火水木」のような自由記述テキストを
// 入力できる欄は存在しない。そのため仕様の手順にある「リマインダー対象曜日に『火水木』と入力する」は、この
// 画面上では実行できない操作である。また送信時刻欄（#rm-set-time）はブラウザネイティブの
// <input type="time"> であり、"25:30" のような時刻表現外の文字列を入力しても、ブラウザ側でそのまま
// 空値へ正規化される（アプリ側の独自バリデーションではない）。さらに #rm-settings-save のクリックハンドラは
// アプリ側の形式検証を一切行わず、常にモーダルを閉じて保存完了トーストを表示するのみで、そもそもこの機能は
// バックエンドAPIへのfetch呼び出しを一度も行わない。したがって「バックエンド保存API呼び出しは発生しない」
// という期待結果の一部は現状の実装でも常に成立するが、「時刻はHH:MM形式で...」「曜日は定義値（月〜日）のみ...」
// という入力エラーメッセージの表示は実装されていない。これらの食い違いは .aivic/batches/18/unresolved.md に
// 記録し、本テストは画面上で実行可能な範囲（送信時刻欄への形式違反値の入力）で仕様の期待結果の文言どおりに
// 検証する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('リマインダー設定の入力値が形式ルールに違反すると、保存が拒否されて入力エラーが表示される', async ({
  page,
}) => {
  // 手順1: 日報確認・管理画面へログインする
  await login(page, 'leader_scen680');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順2: リマインダー設定管理セクションを開く
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  await page.locator('#rm-settings-btn').click();
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toHaveClass(/is-visible/);

  // 手順3: リマインダー通知送信時刻に「25:30」と入力する（HH:MM形式違反）
  await page.locator('#rm-set-time').fill('25:30');

  // 手順4: リマインダー対象曜日に「火水木」と入力する（定義値外の形式）
  // 画面上は曜日ごとのチェックボックス（月〜日）のみで自由記述欄が存在しないため、
  // 仕様が想定する自由入力操作は実行できない（詳細は unresolved.md 参照）。

  // ネットワークリクエストを監視する
  const requestUrls: string[] = [];
  page.on('request', (req) => requestUrls.push(req.url()));

  // 手順5: 保存ボタンをクリックする
  await page.locator('#rm-settings-save').click();
  await page.waitForTimeout(300);

  // 手順6: 画面上に入力エラーメッセージが表示されることを確認する
  await expect(
    page.getByText('時刻はHH:MM形式で入力してください')
  ).toBeVisible();
  await expect(
    page.getByText('曜日は定義値（月〜日）のみ選択可能です')
  ).toBeVisible();

  // 手順7: ネットワークトレースでリマインダー設定保存APIが呼び出されていないことを検証する
  const settingsSaveRequests = requestUrls.filter((url) => /reminder.*setting|setting.*reminder/i.test(url));
  expect(settingsSaveRequests).toHaveLength(0);
});
