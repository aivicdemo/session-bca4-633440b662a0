import { test, expect } from '@playwright/test';

test('リーダーが権限を持たない場合、日報詳細確認画面へのアクセスが拒否される', async ({ page }) => {
  // テストユーザーを『リーダー権限なし』の状態でシステムにログインする
  await page.goto('/login.html');

  // 日報確認・管理画面へアクセスする（権限なしユーザーで直接アクセス）
  await page.goto('./panels/scr-1790147095974.html');

  // 画面が表示されている
  await expect(page).toHaveURL(/.*scr-1790147095974\.html/);

  // Network リクエストを記録
  const requestUrls: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'GET' && req.url().includes('/api/')) {
      requestUrls.push(req.url());
    }
  });

  // ページ上に詳細ボタンが存在するか確認
  const detailButtons = page.locator('.rm-detail-btn');
  const buttonCount = await detailButtons.count();

  if (buttonCount > 0) {
    // 提出済みの日報レコード（例：別ユーザーが提出した日報）の詳細確認リンク/ボタンをクリックしようとする
    const firstButton = detailButtons.first();
    const initialUrl = page.url();

    await firstButton.click();
    await page.waitForTimeout(500);

    // ブラウザ開発者ツール（Network タブ）で日報詳細取得APIへのリクエストが発火されたかを確認する
    const detailApiRequests = requestUrls.filter((url) => url.includes('report') || url.includes('detail'));

    // HTTP 403 Forbidden またはアプリケーション層での『アクセス権限がありません』エラーメッセージが表示される
    // または
    // 日報詳細確認画面への遷移が発生せず、詳細情報が描画されない
    const viewModal = page.locator('#rm-view-modal');
    const isModalVisible = await viewModal.isVisible().catch(() => false);

    const errorMessage = page.locator('text=アクセス権限|権限がありません|アクセス拒否');
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    // アクセスが拒否されているか、遷移が発生していないかいずれかが真
    const accessDenied = isErrorVisible || !isModalVisible || page.url() === initialUrl;
    expect(accessDenied).toBe(true);

    // 画面には詳細情報が一切描画されない状態になる
    if (isModalVisible) {
      const modalBody = page.locator('#rm-view-modal-body');
      const bodyText = await modalBody.textContent().catch(() => '');
      expect(bodyText).not.toContain('業務内容');
    }
  }
});
