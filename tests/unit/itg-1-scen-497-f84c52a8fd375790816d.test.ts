import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-497: 有効なメールアドレスに対してメール送信が成功する場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully send daily report submission notification with valid email', async () => {
    // 有効な入力値を準備
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

    // validateEmailAddressForDelivery をスタブ化（成功）
    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: true, reason: null });

    // buildNotificationContent をスタブ化
    const mockBuildNotificationContent = jest
      .fn()
      .mockReturnValue({
        toAddress: 'leader@company.example.com',
        subject: '【日報】2024年01月15日 田中太郎',
        body: '田中太郎さんからの日報です\n\n本日は顧客A社との打ち合わせを実施し、要件定義書をまとめた。明日は内部レビューを予定。',
      });

    // recordEmailSendingHistory をスタブ化
    const mockRecordEmailSendingHistory = jest
      .fn()
      .mockReturnValue('history-20240115-001');

    // メール送信処理をスタブ化（成功）
    const mockEmailSend = (jest.fn() as any)
      .mockResolvedValue({ success: true, messageId: 'msg-12345', sentAt: '2024-01-15T18:30:15Z' });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'buildNotificationContent'
    ).mockImplementation(mockBuildNotificationContent);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'recordEmailSendingHistory'
    ).mockImplementation(mockRecordEmailSendingHistory);

    const result = await sendDailyReportSubmissionNotification(input);

    // 期待値の検証
    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-20240115-001');
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).toBe('2024-01-15T18:30:15Z');
    expect(result.sentAt).not.toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('should call validateEmailAddressForDelivery and succeed', async () => {
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

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: true, reason: null });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    await sendDailyReportSubmissionNotification(input);

    // validateEmailAddressForDelivery が呼び出されたことを確認
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalled();
  });

  it('should build notification content with correct parameters', async () => {
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

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: true });

    const mockBuildNotificationContent = jest
      .fn()
      .mockReturnValue({
        toAddress: 'leader@company.example.com',
        subject: '【日報】2024年01月15日 田中太郎',
        body: 'メール本文',
      });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'buildNotificationContent'
    ).mockImplementation(mockBuildNotificationContent);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'recordEmailSendingHistory'
    ).mockReturnValue('history-id');

    await sendDailyReportSubmissionNotification(input);

    // buildNotificationContent が呼び出されたことを確認
    expect(mockBuildNotificationContent).toHaveBeenCalled();
  });

  it('should record email sending history and return non-null IDs', async () => {
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

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: true });

    const mockBuildNotificationContent = jest
      .fn()
      .mockReturnValue({
        toAddress: 'leader@company.example.com',
        subject: '【日報】2024年01月15日 田中太郎',
        body: 'メール本文',
      });

    const mockRecordEmailSendingHistory = jest
      .fn()
      .mockReturnValue('history-20240115-001');

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'buildNotificationContent'
    ).mockImplementation(mockBuildNotificationContent);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'recordEmailSendingHistory'
    ).mockImplementation(mockRecordEmailSendingHistory);

    const result = await sendDailyReportSubmissionNotification(input);

    // 記録されたメール送信履歴IDが null ではないことを確認
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
  });
});
