import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  DailyReportContentInvalidError,
} from '../../src/logic/email-notification-management';

describe('SCEN-520: reporterName が空文字列の場合、メール本文生成時にエラーになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reporterName が空文字列のとき例外がスロー される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20250115-001',
      reportContent: '本日の業務内容',
      reportDate: '2025-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '',
      submissionTimestamp: '2025-01-15T09:00:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      // エラーが throw されなかった場合は失敗とする（仕様ではエラーが発生すべき）
      expect(false).toBe(true);
    } catch (error: any) {
      // エラーが throw された場合、DailyReportContentInvalidError であることを確認
      expect(error instanceof DailyReportContentInvalidError).toBe(true);
      expect(error.message).toContain('報告者');
    }
  });
});
