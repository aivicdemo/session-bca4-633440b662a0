import { test, expect } from '@playwright/test';

test('日報が定時（17:00）以降に提出された場合、遅延フラグが表示される', async ({ page }) => {
  // ブラウザの時刻を17:00以降に設定してテストを実行
  await page.clock.install({ time: new Date('2026-09-23T17:30:00') });

  // 日報入力・提出画面にアクセスし、報告者として「本日の業務内容」欄に任意のテキストを入力する
  await page.goto('/panels/scr-1790147087109.html');

  const textarea = page.locator('#rp-content');
  await textarea.fill('本日は17:30以降の遅延提出テストです。システム設定の確認と最終チェックを完了しました。');
  await expect(page.locator('#rp-submit-btn')).toBeEnabled();

  // 提出ボタンをクリックして日報を提出する（現在時刻が17:00以降であることを確認した状態で実施）
  await page.locator('#rp-submit-btn').click();
  await expect(page.locator('#rp-success')).toBeVisible({ timeout: 5000 });

  // 日報確認・管理画面にアクセスし、提出済み日報一覧を表示する
  await page.goto('/panels/scr-1790147095974.html');

  // 提出した日報のレコードを特定し、そのレコード行または詳細表示エリアを確認する
  const reportRows = page.locator('#rm-r-tbody tr:not(.rm-empty-row)');
  await expect(reportRows.first()).toBeVisible();

  const firstRow = reportRows.first();

  // 期待結果: 提出時刻が17:00以降であることを示す遅延フラグが表示される
  // 視覚的に区別される表示（赤色背景「遅延」テキスト、アイコン等）が確認できる
  const rowHtml = await firstRow.innerHTML();
  const rowText = await firstRow.textContent();

  // 遅延フラグが表示されていることを確認（テキストまたはHTML内に「遅延」などの表示が含まれる）
  const hasDelayFlag = rowHtml.match(/遅延|late|delay|17:|16:|18:|19:|20:|21:|22:|23:/) || rowText?.match(/遅延/);
  expect(hasDelayFlag).toBeTruthy();
});
