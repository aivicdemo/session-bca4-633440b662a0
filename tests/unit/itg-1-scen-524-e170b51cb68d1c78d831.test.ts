import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  LeaderEmailAddressNotFoundError,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-524: リーダーメールアドレスが null の場合、送信を中止してエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('LeaderEmailAddressNotFoundError がスロー（throw）される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-1',
      dailyReportId: 'report-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-1',
      leaderEmailAddress: null as any,
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);
    mockSend.mockRejectedValue(
      new LeaderEmailAddressNotFoundError('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。')
    );

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressNotFoundError);
    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。'
    );
  });
});
