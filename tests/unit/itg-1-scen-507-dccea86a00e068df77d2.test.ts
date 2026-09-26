import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  SendDailyReportSubmissionNotificationInput,
  LeaderEmailAddressInvalidError,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-507: メールアドレスの形式が不正な場合、sendLeaderNotificationEmail で「メールアドレスの形式が無効です」のエラーが発生する', () => {
  let mockValidateEmailAddressForDelivery: jest.MockedFunction<any>;
  let mockSendDailyReportSubmissionNotification: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
    mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
  });

  it('メールアドレスの形式が不正（例：invalid-email）の場合、LeaderEmailAddressInvalidError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-email',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が無効です',
      errorCode: 'INVALID_FORMAT',
    });

    mockSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressInvalidError('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。')
    );

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressInvalidError);
  });

  it('メールアドレスの形式が不正（例：user@）の場合、LeaderEmailAddressInvalidError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-002',
      dailyReportId: 'report-20240115-002',
      reportContent: '本日は設計レビューを実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user@',
      reporterName: '鈴木花子',
      submissionTimestamp: '2024-01-15T10:00:00Z',
    };

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が無効です',
      errorCode: 'INVALID_FORMAT',
    });

    mockSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressInvalidError('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。')
    );

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressInvalidError);
  });

  it('メールアドレスの形式が不正（例：@domain.com）の場合、LeaderEmailAddressInvalidError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-003',
      dailyReportId: 'report-20240115-003',
      reportContent: '本日は会議に出席',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '@domain.com',
      reporterName: '佐藤太郎',
      submissionTimestamp: '2024-01-15T11:00:00Z',
    };

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が無効です',
      errorCode: 'INVALID_FORMAT',
    });

    mockSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressInvalidError('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。')
    );

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressInvalidError);
  });

  it('メールアドレスの形式が不正（例：user name@domain.com）の場合、LeaderEmailAddressInvalidError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-004',
      dailyReportId: 'report-20240115-004',
      reportContent: '本日はテストを実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user name@domain.com',
      reporterName: '田中次郎',
      submissionTimestamp: '2024-01-15T12:00:00Z',
    };

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が無効です',
      errorCode: 'INVALID_FORMAT',
    });

    mockSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressInvalidError('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。')
    );

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressInvalidError);
  });
});
