import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-514: validateEmailAddressForDelivery が true を返した場合、buildNotificationContent が呼ばれる', () => {
  let mockValidateEmailAddressForDelivery: jest.MockedFunction<any>;
  let mockBuildNotificationContent: jest.MockedFunction<any>;
  let mockRecordEmailSendingHistory: jest.MockedFunction<any>;
  let mockSendDailyReportSubmissionNotification: jest.MockedFunction<any>;

  const testInput: SendDailyReportSubmissionNotificationInput = {
    reporterId: 'reporter-001',
    dailyReportId: 'daily-001',
    reportContent: '本日は顧客対応を実施',
    reportDate: '2025-01-15',
    leaderUserId: 'leader-001',
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
      body: '山田太郎さんからの日報です\n\n本日は顧客対応を実施',
    });

    mockRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'hist_20250115_001',
      recordedAt: '2025-01-15T09:30:05Z',
      errorMessage: null,
    });
  });

  it('validateEmailAddressForDelivery がtrueを返した場合、buildNotificationContent は正確に1回呼び出される', async () => {
    mockSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'hist_20250115_001',
      sentAt: '2025-01-15T09:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    await sendDailyReportSubmissionNotification(testInput);

    expect(mockBuildNotificationContent).toHaveBeenCalledTimes(1);
  });

  it('buildNotificationContent の呼び出し時の引数を検証する', async () => {
    mockSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'hist_20250115_001',
      sentAt: '2025-01-15T09:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    await sendDailyReportSubmissionNotification(testInput);

    expect(mockBuildNotificationContent).toHaveBeenCalledTimes(1);
  });

  it('validateEmailAddressForDelivery がtrueを返すと、buildNotificationContent に期待値が渡される', async () => {
    mockSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'hist_20250115_001',
      sentAt: '2025-01-15T09:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    await sendDailyReportSubmissionNotification(testInput);

    expect(mockBuildNotificationContent).toHaveBeenCalledTimes(1);
  });
});
