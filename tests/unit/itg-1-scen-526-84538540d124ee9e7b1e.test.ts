import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  ReporterNotValidError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-526: 報告者が無効化された状態である場合、ReporterNotValidError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ReporterNotValidError when reporter is not valid', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'invalid-reporter-id',
      dailyReportId: 'report-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: 'テスト太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    const mockValidateEmailAddressForDelivery = jest.mocked(
      validateEmailAddressForDelivery
    );
    const mockBuildNotificationContent = jest.mocked(buildNotificationContent);
    const mockRecordEmailSendingHistory = jest.mocked(recordEmailSendingHistory);

    await expect(
      sendDailyReportSubmissionNotification(input)
    ).rejects.toThrow(
      new ReporterNotValidError(
        '報告者が無効であるため、メール通知を送信できません。'
      )
    );

    expect(mockValidateEmailAddressForDelivery).not.toHaveBeenCalled();
    expect(mockBuildNotificationContent).not.toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
