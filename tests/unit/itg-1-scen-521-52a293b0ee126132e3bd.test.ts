import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-521: reporterName が null の場合、メール本文生成時にエラーになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error output when reporterName is null', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter001',
      dailyReportId: 'report001',
      reportContent: '本日は営業資料の作成に従事しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: null,
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue({
      isValid: true,
    });

    jest.mocked(buildNotificationContent).mockImplementation((data) => {
      if (data.reporterName === null || data.reporterName === undefined) {
        throw new Error('報告者の氏名が登録されていない');
      }
      return {
        subject: 'テスト',
        body: 'テスト本文',
      };
    });

    const mockRecordEmailSendingHistory = jest.mocked(recordEmailSendingHistory);
    const mockBuildNotificationContent = jest.mocked(buildNotificationContent);

    const result: SendDailyReportSubmissionNotificationOutput =
      await sendDailyReportSubmissionNotification(input);

    expect(mockBuildNotificationContent).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBe(null);
    expect(result.sentAt).toBe(null);
    expect(result.errorMessage).toMatch(
      /報告者の氏名が登録されていない|報告者の情報が不完全/
    );
    expect(result.adminNotificationSent).toBe(true);
  });
});
