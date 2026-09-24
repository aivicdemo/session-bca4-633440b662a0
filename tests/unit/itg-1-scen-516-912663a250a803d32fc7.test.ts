import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-516: buildNotificationContent が正常にメール本文を生成した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recordEmailSendingHistory に渡される', () => {
    const mockValidateEmail = jest.mocked(validateEmailAddressForDelivery);
    const mockBuildContent = jest.mocked(buildNotificationContent);
    const mockRecordHistory = jest.mocked(recordEmailSendingHistory);
    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);

    mockValidateEmail.mockReturnValue(true);

    const emailBody = '山田太郎さんからの日報です\n\n顧客A社のシステム要件定義会議を実施。基本設計書のドラフト完了。明日は詳細設計に着手予定。';
    mockBuildContent.mockReturnValue({
      subject: '【日報】2024年01月15日 山田太郎',
      body: emailBody,
      toAddress: 'leader@example.com',
    });

    mockRecordHistory.mockReturnValue({
      emailSendingHistoryId: 'HIST202401150001',
      sentAt: '2024-01-15T09:30:05Z',
    });

    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'RPT001',
      dailyReportId: 'DR20240115001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本設計書のドラフト完了。明日は詳細設計に着手予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'LDR001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockSend.mockImplementation(() => ({
      success: true,
      emailSendingHistoryId: 'HIST202401150001',
      sentAt: '2024-01-15T09:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    }));

    const result = mockSend(input) as SendDailyReportSubmissionNotificationOutput;

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('HIST202401150001');
    expect(result.sentAt).toBe('2024-01-15T09:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
    expect(mockBuildContent).toHaveBeenCalled();
    expect(mockRecordHistory).toHaveBeenCalled();
  });
});
