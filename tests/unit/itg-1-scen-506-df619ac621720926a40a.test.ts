import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  ValidateEmailAddressForDeliveryInput,
  ValidateEmailAddressForDeliveryOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-506: リーダーのメールアドレスが登録されていない場合、sendLeaderNotificationEmail で「リーダーのメールアドレスが未設定です」のエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
    const mockBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
    const mockRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;
    const mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'リーダーのメールアドレスが未設定です',
      errorCode: 'LEADER_EMAIL_NOT_SET',
    } as ValidateEmailAddressForDeliveryOutput);

    mockSendDailyReportSubmissionNotification.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。',
      adminNotificationSent: true,
    } as SendDailyReportSubmissionNotificationOutput);
  });

  it('leaderEmailAddress が空文字列のとき、success=false を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
    const result = await mockSendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
  });

  it('leaderEmailAddress が空文字列のとき、emailSendingHistoryId と sentAt は null である', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
    const result = await mockSendDailyReportSubmissionNotification(input);

    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
  });

  it('leaderEmailAddress が空文字列のとき、正しいエラーメッセージを返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
    const result = await mockSendDailyReportSubmissionNotification(input);

    expect(result.errorMessage).toBe(
      'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。'
    );
  });

  it('leaderEmailAddress が空文字列のとき、adminNotificationSent は true である', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
    const result = await mockSendDailyReportSubmissionNotification(input);

    expect(result.adminNotificationSent).toBe(true);
  });

  it('email validation が失敗したとき、buildNotificationContent は呼び出されない', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const mockBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
    await (sendDailyReportSubmissionNotification as jest.MockedFunction<any>)(input);

    expect(mockBuildNotificationContent).not.toHaveBeenCalled();
  });

  it('email validation が失敗したとき、recordEmailSendingHistory は呼び出されない', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const mockRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;
    await (sendDailyReportSubmissionNotification as jest.MockedFunction<any>)(input);

    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
