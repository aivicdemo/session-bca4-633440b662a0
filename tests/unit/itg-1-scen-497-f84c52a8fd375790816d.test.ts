jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-497: 有効なメールアドレスに対してメール送信が成功する場合', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('有効なメールアドレスとコンテンツでメール送信が成功する場合、success=true、emailSendingHistoryId=『history-20240115-001』（null ではない）、sentAt=『2024-01-15T18:30:15Z』（ISO 8601形式、null ではない）、errorMessage=null、adminNotificationSent=false が返される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A社との打ち合わせを実施し、要件定義書をまとめた。明日は内部レビューを予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      toAddress: 'leader@company.example.com',
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客A社との打ち合わせを実施し、要件定義書をまとめた。明日は内部レビューを予定。',
    });

    mockedRecordEmailSendingHistory.mockResolvedValue({
      emailSendingHistoryId: 'history-20240115-001',
      sentAt: '2024-01-15T18:30:15Z',
    });

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-20240115-001');
    expect(result.sentAt).toBe('2024-01-15T18:30:15Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('メール送信が成功したことを示す success=true が返却される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A社との打ち合わせを実施し、要件定義書をまとめた。明日は内部レビューを予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({ isValid: true, reason: null });
    mockedBuildNotificationContent.mockResolvedValue({
      toAddress: 'leader@company.example.com',
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客A社との打ち合わせを実施し、要件定義書をまとめた。明日は内部レビューを予定。',
    });
    mockedRecordEmailSendingHistory.mockResolvedValue({
      emailSendingHistoryId: 'history-20240115-001',
      sentAt: '2024-01-15T18:30:15Z',
    });

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
  });

  it('記録されたメール送信履歴ID と送信完了日時がともに null ではないことを確認する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A社との打ち合わせを実施し、要件定義書をまとめた。明日は内部レビューを予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({ isValid: true, reason: null });
    mockedBuildNotificationContent.mockResolvedValue({
      toAddress: 'leader@company.example.com',
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客A社との打ち合わせを実施し、要件定義書をまとめた。明日は内部レビューを予定。',
    });
    mockedRecordEmailSendingHistory.mockResolvedValue({
      emailSendingHistoryId: 'history-20240115-001',
      sentAt: '2024-01-15T18:30:15Z',
    });

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.errorMessage).toBeNull();
  });
});
