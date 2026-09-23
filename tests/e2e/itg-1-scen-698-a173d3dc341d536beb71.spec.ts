import { test, expect, type Page } from '@playwright/test';

// SCEN-698: 超過時間が120分を超える未提出者に対して催促の優先度が「高」と判定される
//
// panels/scr-1790147095974.html の「未提出者・リマインダー」タブには超過時間・催促優先度の
// いずれの列も存在せず（SCEN-696/697 と同様）、リマインダー送信は #rm-send-reminder-btn の
// クリックハンドラ内でページ内メモリの配列を直接書き換えるだけで、fetch 等のネットワーク呼び出しを
// 一切行わない。詳細設計上の EmailNotificationService（src/logic/email-notification-management.ts）の
// sendNonSubmissionAlert 相当の呼び出しはこの画面から発生しないため、Playwright からその呼び出しを
// スタブ・観測する手段が存在しない（内部関数を直接呼び出す代替も許されていない）。
// この食い違いは .aivic/batches/21/unresolved.md に記録する。本テストは仕様の文言どおりに
// 検証を記述する。

async function login(page: Page, username: string) {
  await page.goto('/login.html');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill('password');
  await page.getByTestId('login-button').click();
  await page.waitForURL(/panels\/scr-1790147087109\.html/);
}

test('超過時間が120分を超える未提出者に対して催促の優先度が「高」と判定される', async ({ page }) => {
  // 手順1: 日報確認・管理画面にログインする
  await login(page, 'leader_scen698');
  await page.getByText('管理', { exact: true }).click();
  await page.waitForURL(/panels\/scr-1790147095974\.html/);

  // 手順2: 未提出者一覧を表示する
  await page.locator('.rm-tab[data-tab="reminder"]').click();
  await expect(page.locator('#rm-missing-tbody tr')).not.toHaveCount(0);

  // 手順3: 超過時間が120分を超えるユーザーを特定する（例：超過時間150分のユーザーA）
  // 画面には超過時間を示す列が存在しないため、代替として未提出者一覧の先頭行（高橋 次郎）を対象とする。
  const targetRow = page.locator('#rm-missing-tbody tr', { hasText: '高橋 次郎' });
  await expect(targetRow).toBeVisible();

  // 手順4: そのユーザーに対してリマインダー送信機能を実行する
  await targetRow.locator('.rm-missing-checkbox').check();

  const sendRequests: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'POST' && /sendNonSubmissionAlert/i.test(req.url())) {
      sendRequests.push(req.url());
    }
  });

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#rm-send-reminder-btn').click();

  // 手順5: EmailNotificationService の sendNonSubmissionAlert が呼び出されたことをスタブで確認する
  expect(sendRequests.length).toBeGreaterThan(0);

  // 手順6: 管理画面上で、そのユーザーの催促優先度が「高」として表示されていることを確認する
  await expect(page.locator('.rm-table th', { hasText: '催促優先度' })).toBeVisible();
  await expect(targetRow.locator('.rm-priority-value')).toHaveText('高');
});
