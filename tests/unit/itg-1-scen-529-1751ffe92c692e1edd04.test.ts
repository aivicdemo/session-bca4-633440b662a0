import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-529: reportDate が ISO 8601形式でない場合、処理の動作を確認する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reportDate が ISO 8601形式でない場合、入力値の形式検証に失敗する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: '2024-13-45',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    jest.mocked(validateEmailAddressForDelivery).mockImplementation(() => {
      throw new Error('Should not be called');
    });

    jest.mocked(buildNotificationContent).mockImplementation(() => {
      throw new Error('Should not be called');
    });

    jest.mocked(recordEmailSendingHistory).mockImplementation(() => {
      throw new Error('Should not be called');
    });

    let result: SendDailyReportSubmissionNotificationOutput | undefined;

    try {
      result = await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      // エラーがスローされる場合
    }

    if (result) {
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBeTruthy();
      expect(result.adminNotificationSent).toBe(false);
    }

    expect(validateEmailAddressForDelivery).not.toHaveBeenCalled();
    expect(buildNotificationContent).not.toHaveBeenCalled();
    expect(recordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
