import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  DailyReportContentInvalidError,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-520: reporterName が空文字列の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール本文生成時にエラーになる', () => {
    const mockValidateEmail = jest.mocked(validateEmailAddressForDelivery);
    const mockBuildContent = jest.mocked(buildNotificationContent);
    const mockRecordHistory = jest.mocked(recordEmailSendingHistory);
    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);

    mockValidateEmail.mockReturnValue(true);
    mockBuildContent.mockImplementation(() => {
      throw new DailyReportContentInvalidError('日報の内容が不完全であるため、通知メールを生成できません。');
    });

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

    mockSend.mockImplementation(() => {
      throw new DailyReportContentInvalidError('日報の内容が不完全であるため、通知メールを生成できません。');
    });

    expect(() => mockSend(input)).toThrow(DailyReportContentInvalidError);
    expect(mockRecordHistory).not.toHaveBeenCalled();
  });
});
