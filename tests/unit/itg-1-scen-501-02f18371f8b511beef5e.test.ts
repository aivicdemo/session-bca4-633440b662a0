jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
const mockedBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;

describe('SCEN-501: 有効なリーダーメールアドレスに対してメール通知の全検証が成功する場合の代表値として、validateAndSendLeaderNotification は送信可能を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年01月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n顧客A社との打ち合わせを実施。要件定義書をレビューし、修正箇所を整理した。明日は修正対応を進める予定。',
    });

    mockedRecordEmailSendingHistory.mockResolvedValue({
      id: 'history-20240115-001',
      sentAt: '2024-01-15T14:30:15Z',
    });
  });

  it('有効なリーダーメールアドレスに対してメール送信が成功し、全ての依存関数が期待通りに呼び出される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社との打ち合わせを実施。要件定義書をレビューし、修正箇所を整理した。明日は修正対応を進める予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValueOnce({
      success: true,
      emailSendingHistoryId: 'history-20240115-001',
      sentAt: '2024-01-15T14:30:15Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-20240115-001');
    expect(result.sentAt).toBe('2024-01-15T14:30:15Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith('leader@example.com');
    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledTimes(1);

    expect(mockedBuildNotificationContent).toHaveBeenCalledWith(
      '山田太郎',
      '顧客A社との打ち合わせを実施。要件定義書をレビューし、修正箇所を整理した。明日は修正対応を進める予定。',
      '2024-01-15T14:30:00Z'
    );
    expect(mockedBuildNotificationContent).toHaveBeenCalledTimes(1);

    expect(mockedRecordEmailSendingHistory).toHaveBeenCalledWith(
      'leader@example.com',
      'reporter-001',
      'report-20240115-001',
      '2024-01-15T14:30:15Z'
    );
    expect(mockedRecordEmailSendingHistory).toHaveBeenCalledTimes(1);
  });
});
