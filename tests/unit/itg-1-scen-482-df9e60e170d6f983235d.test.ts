import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressNotFoundError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-482: リーダーメールアドレスが登録されていない場合、LeaderEmailAddressNotFoundError が発生', () => {
  it('リーダーメールアドレスが空文字列の場合、LeaderEmailAddressNotFoundError が発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('LeaderEmailAddressNotFoundError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect((error as Error).message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });
});
