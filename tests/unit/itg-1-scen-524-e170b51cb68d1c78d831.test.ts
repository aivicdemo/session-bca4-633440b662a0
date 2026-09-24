import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  LeaderEmailAddressNotFoundError,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-524: リーダーメールアドレスが null の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('送信を中止してエラーを返す', () => {
    const mockValidateEmail = jest.mocked(validateEmailAddressForDelivery);
    const mockBuildContent = jest.mocked(buildNotificationContent);
    const mockRecordHistory = jest.mocked(recordEmailSendingHistory);
    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);

    mockValidateEmail.mockImplementation(() => {
      throw new LeaderEmailAddressNotFoundError('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    });

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

    mockSend.mockImplementation(() => {
      throw new LeaderEmailAddressNotFoundError('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    });

    expect(() => mockSend(input)).toThrow(LeaderEmailAddressNotFoundError);
    expect(mockRecordHistory).not.toHaveBeenCalled();
  });
});
