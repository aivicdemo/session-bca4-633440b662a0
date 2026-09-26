import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-516: buildNotificationContent が正常にメール本文を生成した場合、recordEmailSendingHistory に渡される', () => {
  let mockValidateEmailAddressForDelivery: jest.MockedFunction<any>;
  let mockBuildNotificationContent: jest.MockedFunction<any>;
  let mockRecordEmailSendingHistory: jest.MockedFunction<any>;
  let mockSendDailyReportSubmissionNotification: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
    mockBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
    mockRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;
    mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
  });

  it('recordEmailSendingHistory に渡される', async () => {
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

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年01月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n顧客A社のシステム要件定義会議を実施。基本設計書のドラフト完了。明日は詳細設計に着手予定。',
    });

    mockRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'HIST202401150001',
      recordedAt: '2024-01-15T09:30:05Z',
      errorMessage: null,
    });

    const expectedOutput: SendDailyReportSubmissionNotificationOutput = {
      success: true,
      emailSendingHistoryId: 'HIST202401150001',
      sentAt: '2024-01-15T09:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    };

    mockSendDailyReportSubmissionNotification.mockResolvedValue(expectedOutput);

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('HIST202401150001');
    expect(result.sentAt).toBe('2024-01-15T09:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
    expect(mockBuildNotificationContent).toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).toHaveBeenCalled();
  });
});
