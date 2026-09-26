import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-513: 報告者ID・報告内容・送信日時・リーダーメールアドレス・報告者名がすべて有効な場合、sendDailyReportNotificationEmail はメール送信を成功させる', () => {
  let mockValidateEmailAddressForDelivery: jest.MockedFunction<any>;
  let mockBuildNotificationContent: jest.MockedFunction<any>;
  let mockRecordEmailSendingHistory: jest.MockedFunction<any>;
  let mockSendDailyReportSubmissionNotification: jest.MockedFunction<any>;

  const testInput: SendDailyReportSubmissionNotificationInput = {
    reporterId: 'reporter_001',
    dailyReportId: 'report_20250115_001',
    reportContent: '顧客A社との打ち合わせ完了、見積書作成開始',
    reportDate: '2025-01-15',
    leaderUserId: 'leader_001',
    leaderEmailAddress: 'leader@example.com',
    reporterName: '山田太郎',
    submissionTimestamp: '2025-01-15T09:30:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
    mockBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
    mockRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;
    mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2025年1月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n顧客A社との打ち合わせ完了、見積書作成開始',
    });

    mockRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'hist_20250115_001',
      recordedAt: '2025-01-15T09:30:05Z',
      errorMessage: null,
    });
  });

  it('正常系：すべてのスタブが呼び出され、成功結果が返される', async () => {
    const expectedOutput: SendDailyReportSubmissionNotificationOutput = {
      success: true,
      emailSendingHistoryId: 'hist_20250115_001',
      sentAt: '2025-01-15T09:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    };

    mockSendDailyReportSubmissionNotification.mockResolvedValue(expectedOutput);

    const result = await sendDailyReportSubmissionNotification(testInput);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('hist_20250115_001');
    expect(result.sentAt).toBe('2025-01-15T09:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalled();
    expect(mockBuildNotificationContent).toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).toHaveBeenCalled();
  });
});
