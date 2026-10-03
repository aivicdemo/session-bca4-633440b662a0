import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressNotFoundError,
  type SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-482: リーダーメールアドレスが登録されていない場合、LeaderEmailAddressNotFoundError が発生して通知を中止する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リーダーメールアドレスが登録されていない場合、LeaderEmailAddressNotFoundError が発生すること', async () => {
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

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressNotFoundError('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressNotFoundError);
    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
  });
});
