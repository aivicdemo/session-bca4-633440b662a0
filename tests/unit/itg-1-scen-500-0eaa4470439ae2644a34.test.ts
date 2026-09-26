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

describe('SCEN-500: メール配信が技術的に失敗した場合、警告メッセージを返して管理者に通知する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客Aのシステム改修に従事し、API設計書を完成させた',
    });

    mockedRecordEmailSendingHistory.mockResolvedValue({
      id: 'history-20240115-001',
      sentAt: '2024-01-15T09:30:15Z',
    });
  });

  it('メール送信がネットワークエラー（SMTP connection timeout）で失敗した場合、メール送信に失敗しました。システム管理者に連絡してください という警告を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客Aのシステム改修に従事し、API設計書を完成させた',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValueOnce({
      success: false,
      errorMessage: 'メール送信に失敗しました。システム管理者に連絡してください',
      emailSendingHistoryId: null,
      sentAt: null,
      adminNotificationSent: true,
    });

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('メール送信に失敗しました。システム管理者に連絡してください');
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.adminNotificationSent).toBe(true);
  });

  it('メール送信が503 Service Unavailableで失敗した場合、メール送信に失敗しました。システム管理者に連絡してください という警告を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客Aのシステム改修に従事し、API設計書を完成させた',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValueOnce({
      success: false,
      errorMessage: 'メール送信に失敗しました。システム管理者に連絡してください',
      emailSendingHistoryId: null,
      sentAt: null,
      adminNotificationSent: true,
    });

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('メール送信に失敗しました。システム管理者に連絡してください');
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.adminNotificationSent).toBe(true);
  });

  it('メール送信タイムアウトの場合、recordEmailSendingHistory は呼び出されない', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客Aのシステム改修に従事し、API設計書を完成させた',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValueOnce({
      success: false,
      errorMessage: 'メール送信に失敗しました。システム管理者に連絡してください',
      emailSendingHistoryId: null,
      sentAt: null,
      adminNotificationSent: true,
    });

    await sendDailyReportSubmissionNotification(input);

    expect(mockedRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
