import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressNotFoundError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-510: リーダーのメールアドレスが登録されていない場合、sendDailyReportNotificationEmail で「リーダーのメールアドレスが設定されていません。管理者に連絡してください」のエラーが発生する', () => {
  let mockSendDailyReportSubmissionNotification: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
  });

  it('リーダーメールアドレスが空文字列の場合、LeaderEmailAddressNotFoundError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressNotFoundError('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。')
    );

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressNotFoundError);
  });
});
