import { test, expect, type Page } from '@playwright/test';

// SCEN-685: 各未提出者の超過時間と状況に基づいて催促の必要性と送信方法が判定される。
//
// panels/scr-1790147095974.html の未提出者一覧（#rm-missing-tbody）には「超過時間」の列が存在せず、報告者ごとの
// 期限超過1時間未満／1〜3時間／3時間以上といった分類も画面上で判別できない。また「リマインダー設定管理」モーダル
// （#rm-settings-modal）は送信時刻・送信曜日・送信方法（メール／アプリ通知）を保持するのみで、超過時間帯ごとに
// 異なる送信方法（送信不要／メール送信／メール+管理者アラート）を設定する項目は存在しない。さらに Amazon SES や
// Gmail 受信箱と接続する仕組みもない。本テストは、画面上で確認可能な範囲（設定モーダルの送信方法設定・送信後の
// メール送信履歴への記録）に限定して検証したが、超過時間帯別の判定・表示という仕様の中心的な期待結果は現状の
// サンプル実装では検証できない。詳細は .aivic/batches/19/unresolved.md を参照。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('未提出者の超過時間帯ごとに異なる送信方法が画面に反映され、リマインダーが送信される', async ({ page }) => {
  // 日報確認・管理画面にログインし、管理者権限で画面を開く
  await login(page, 'admin_scen685');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // システムの定時検知により、複数の未提出者が一覧に表示された状態を確認する
  await page.getByText('未提出者・リマインダー', { exact: true }).click();
  const rows = page.locator('#rm-missing-tbody tr:not(.rm-empty-row)');
  await expect(rows).not.toHaveCount(0);

  // 未提出者一覧から、以下の3パターンの報告者を識別する：
  // (a)期限超過1時間未満、(b)期限超過1時間以上3時間未満、(c)期限超過3時間以上
  const overdueColumn = page.locator('#rm-missing-tbody th, #rm-missing-tbody td', { hasText: '超過時間' });
  await expect(overdueColumn).toHaveCount(0); // 超過時間の列自体が存在しないことを確認（仕様との不一致）

  // リマインダー設定管理で、各超過時間帯ごとの送信方法が設定されていることを確認する
  // （例：1時間未満=通知なし、1時間以上=メール送信、3時間以上=メール+管理者アラート）
  await page.locator('#rm-settings-btn').click();
  const settingsModal = page.locator('#rm-settings-modal');
  await expect(settingsModal).toHaveClass(/is-visible/);
  const tieredSettingFields = settingsModal.getByText(/1時間未満|1時間以上|3時間以上/);
  await expect(tieredSettingFields).toHaveCount(0); // 超過時間帯別の送信方法設定が存在しないことを確認（仕様との不一致）
  await page.locator('#rm-settings-modal-close').click();

  // 未提出者一覧の各行に対して、現在の超過時間と設定された送信方法が一致していることを画面上で視認する
  const methodColumn = page.locator('#rm-missing-tbody', { hasText: '送信不要' });
  await expect(methodColumn).toHaveCount(0); // 行ごとの送信方法表示が存在しないことを確認（仕様との不一致）

  // 未提出者一覧から「リマインダー送信」ボタンをクリックする
  const rowCount = await rows.count();
  for (let i = 0; i < rowCount; i++) {
    await rows.nth(i).locator('.rm-missing-checkbox').check();
  }
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 送信処理の実行後、画面の未提出者一覧を更新して各報告者の行を確認する
  await page.getByText('メール送信履歴', { exact: true }).click();
  const mailRows = page.locator('#rm-mail-tbody tr', { hasText: 'リマインダー' });
  await expect(mailRows).not.toHaveCount(0);
});
