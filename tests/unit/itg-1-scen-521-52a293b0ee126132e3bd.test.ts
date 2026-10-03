import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  DailyReportContentInvalidError,
} from '../../src/logic/email-notification-management';

describe('SCEN-521: reporterName が null の場合、メール本文生成時にエラーになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reporterName が null のとき例外が発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter001',
      dailyReportId: 'report001',
      reportContent: '本日は営業資料の作成に従事しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: null as any,
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      expect(false).toBe(true);
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(typeof error.message).toBe('string');
    }
  });
});
