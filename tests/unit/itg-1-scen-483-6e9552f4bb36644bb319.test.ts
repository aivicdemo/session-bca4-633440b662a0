import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  DailyReportContentInvalidError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-483: 日報の入力内容が空白の場合、DailyReportContentInvalidError が発生', () => {
  it('reportContent が空文字列の場合、DailyReportContentInvalidError が発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('DailyReportContentInvalidError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DailyReportContentInvalidError);
      expect((error as Error).message).toBe('日報の内容が不完全であるため、通知メールを生成できません。');
    }
  });
});
