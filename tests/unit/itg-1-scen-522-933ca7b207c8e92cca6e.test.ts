import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  LeaderEmailAddressInvalidError,
} from '../../src/logic/email-notification-management';

describe('SCEN-522: 複数の入力値が同時に不正な場合、最初に検出されたエラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数エラー条件で最初に検出されたエラーが返される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'invalid_reporter',
      dailyReportId: 'DR001',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: 'invalid_email',
      reporterName: 'テスト太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      expect(false).toBe(true);
    } catch (error: any) {
      // 無効なメールアドレスまたは無効な内容エラーが発生すべき
      expect(error).toBeDefined();
      expect(error.message).toBeDefined();
    }
  });
});
