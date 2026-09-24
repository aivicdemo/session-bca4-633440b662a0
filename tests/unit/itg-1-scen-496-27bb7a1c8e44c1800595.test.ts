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
  EmailSendingFailedError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-496: メール送信サーバーへの接続に失敗した場合、警告が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('メール送信サーバーへの接続がタイムアウトする場合、EmailSendingFailedError が throw されるまたはエラーメッセージが『メール送信に失敗しました。管理者に確認してください』を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日はタスクA を完了、明日タスクB を開始予定',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.jp',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      toAddress: 'leader@company.jp',
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日はタスクA を完了、明日タスクB を開始予定',
    });

    // メール送信処理がサーバー接続失敗を発生させる
    mockedRecordEmailSendingHistory.mockRejectedValue(
      new EmailSendingFailedError('メール送信に失敗しました。管理者に確認してください')
    );

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected EmailSendingFailedError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingFailedError);
      expect((error as Error).message).toBe('メール送信に失敗しました。管理者に確認してください');
    }
  });

  it('戻り値は success=false、emailSendingHistoryId=null、sentAt=null、errorMessage=『メール送信に失敗しました。管理者に確認してください』、adminNotificationSent=true となる', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日はタスクA を完了、明日タスクB を開始予定',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.jp',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      toAddress: 'leader@company.jp',
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日はタスクA を完了、明日タスクB を開始予定',
    });

    mockedRecordEmailSendingHistory.mockRejectedValue(
      new EmailSendingFailedError('メール送信に失敗しました。管理者に確認してください')
    );

    let result;
    try {
      result = await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      // エラー発生時
      expect(error).toBeInstanceOf(EmailSendingFailedError);
    }

    if (result) {
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に確認してください');
      expect(result.adminNotificationSent).toBe(true);
    }
  });
});
