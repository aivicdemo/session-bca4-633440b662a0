jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;

describe('SCEN-499: メールアドレスの形式が不正な場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('leaderEmailAddress に不正な形式『user@』を設定した場合、LeaderEmailAddressInvalidError 例外が発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user@',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が正しくありません。確認してください',
    });

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressInvalidError
    );
  });

  it('leaderEmailAddress に不正な形式『@domain.com』を設定した場合も同様にエラーが発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '@domain.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が正しくありません。確認してください',
    });

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressInvalidError
    );
  });

  it('エラーメッセージが『メールアドレスの形式が正しくありません。確認してください』である', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'userdomain.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が正しくありません。確認してください',
    });

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected LeaderEmailAddressInvalidError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect((error as Error).message).toBe('メールアドレスの形式が正しくありません。確認してください');
    }
  });

  it('buildNotificationContent、recordEmailSendingHistory などの後続処理は呼び出されず、メール送信履歴は記録されない', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-format',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が正しくありません。確認してください',
    });

    const { buildNotificationContent, recordEmailSendingHistory } = require('../../src/logic/email-notification-management');

    try {
      await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect(buildNotificationContent).not.toHaveBeenCalled();
      expect(recordEmailSendingHistory).not.toHaveBeenCalled();
    }
  });
});
