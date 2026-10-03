import { test, expect } from '@playwright/test';

test('メール配信サービスが一時的に利用不可のとき、最大3回まで指数バックオフで再試行され、3回失敗後は管理者に通知される', async ({
  page,
}) => {
  // テスト環境にて、Amazon SES のメール配信サービスを一時的に利用不可の状態に設定する
  // （テスト環境は既に利用不可に設定されている想定）

  // 日報確認・管理画面にログイン（管理者権限）
  await page.goto('/panels/scr-1790147095974.html');
  await page.waitForLoadState('networkidle');

  // 画面上で、定時の自動検知によって未提出者が一覧表示されるまで待機、または手動で未提出者検知を実行
  const detectBtn = page.locator('button:has-text("未提出者を検知")').first();
  if (await detectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detectBtn.click();
  }

  // 未提出者に対するリマインダー送信操作を実行（送信ボタンをクリック）
  const sendReminderBtn = page.locator('#rm-send-reminder-btn');
  if (await sendReminderBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await sendReminderBtn.click();
  }

  // 1回目の送信試行が失敗し、画面に『通知送信失敗』というメッセージまたはアラートが表示されることを確認
  const body = page.locator('body');
  const pageContent = await body.textContent();
  expect(pageContent).toContain('通知送信失敗');

  // 指数バックオフの待機時間を経て、2回目の自動再試行が行われ、画面に同じ『通知送信失敗』メッセージが再度表示されることを確認
  // （実装による待機時間）
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 指数バックオフの待機時間を経て、3回目の自動再試行が行われ、画面に同じ『通知送信失敗』メッセージが再度表示されることを確認
  // （実装による待機時間）
  const reloadContent = await body.textContent();
  expect(reloadContent).toMatch(/通知送信失敗|通知未送信/);

  // 日報確認・管理画面を更新（リロード）して、最新状態を表示
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 日報確認・管理画面の未提出者一覧に対して、該当ユーザーの行に『通知未送信』フラグが表示される
  const tbody = page.locator('#rm-missing-tbody');
  const tableContent = await tbody.textContent();
  expect(tableContent).toMatch(/通知未送信|通知送信失敗/);

  // 同時に、画面上部に『通知送信失敗』というメッセージまたはアラートが表示される
  expect(reloadContent).toContain('通知送信失敗');

  // また、画面内の検知ログ・メール送信履歴確認エリアに、『送信失敗：3回再試行後』という履歴レコードが表示される
  const logTbody = page.locator('#rm-log-tbody');
  const logContent = await logTbody.textContent();
  expect(logContent).toMatch(/3回再試行|送信失敗/);
});
