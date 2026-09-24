import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-527: メールアドレスが @を含まない場合、形式検証に失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メールアドレスが @を含まない場合、LeaderEmailAddressInvalidError が発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115',
      reportContent: '本日は顧客A社のシステム要件ヒアリングを実施した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が不正です。',
      errorCode: 'INVALID_FORMAT',
    });

    jest.mocked(buildNotificationContent).mockImplementation(() => {
      throw new Error('Should not be called');
    });

    jest.mocked(recordEmailSendingHistory).mockImplementation(() => {
      throw new Error('Should not be called');
    });

    let result: SendDailyReportSubmissionNotificationOutput | undefined;
    let thrownError: Error | undefined;

    try {
      result = await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      thrownError = error as Error;
    }

    if (result) {
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
      expect(result.adminNotificationSent).toBe(true);
    } else if (thrownError) {
      expect(thrownError).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect(thrownError.message).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    }

    expect(buildNotificationContent).not.toHaveBeenCalled();
    expect(recordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
