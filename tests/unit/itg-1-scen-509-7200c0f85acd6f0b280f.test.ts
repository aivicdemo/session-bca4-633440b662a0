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

describe('SCEN-509: 有効なリーダーメールアドレスと報告内容が揃っている場合、sendLeaderNotificationEmail はメール送信を成功させる', () => {
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

  it('メール送信に成功し、適切な出力を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20250115-001',
      reportContent: '本日は顧客A社との打ち合わせを実施。成果物の仕様書初版を完成させた。課題は承認待ち。明日は顧客レビュー対応予定。',
      reportDate: '2025-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2025-01-15T09:30:00Z',
    };

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2025年1月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n本日は顧客A社との打ち合わせを実施。成果物の仕様書初版を完成させた。課題は承認待ち。明日は顧客レビュー対応予定。',
    });

    mockRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'hist_20250115_001',
      recordedAt: '2025-01-15T09:30:05Z',
      errorMessage: null,
    });

    const expectedOutput: SendDailyReportSubmissionNotificationOutput = {
      success: true,
      emailSendingHistoryId: 'hist_20250115_001',
      sentAt: '2025-01-15T09:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    };

    mockSendDailyReportSubmissionNotification.mockResolvedValue(expectedOutput);

    const result = await sendDailyReportSubmissionNotification(input);

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
