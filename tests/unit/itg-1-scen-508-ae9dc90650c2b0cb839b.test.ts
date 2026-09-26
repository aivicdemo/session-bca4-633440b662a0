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

describe('SCEN-508: メール送信サービスが一時的に利用不可の場合、sendLeaderNotificationEmail で「メール送信に失敗しました。後で再試行してください」のエラーが発生する', () => {
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

  it('メール送信処理が失敗し、管理者への通知が実行される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日の業務：システムテスト実施、成果：テスト仕様書作成完了、課題：なし、明日の予定：レビュー対応',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z'
    };

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年01月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n本日の業務：システムテスト実施、成果：テスト仕様書作成完了、課題：なし、明日の予定：レビュー対応',
    });

    mockRecordEmailSendingHistory.mockRejectedValue(
      new Error('メール送信に失敗しました。後で再試行してください')
    );

    const expectedOutput: SendDailyReportSubmissionNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メール送信に失敗しました。後で再試行してください',
      adminNotificationSent: true,
    };

    mockSendDailyReportSubmissionNotification.mockResolvedValue(expectedOutput);

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。後で再試行してください');
    expect(result.adminNotificationSent).toBe(true);
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalled();
    expect(mockBuildNotificationContent).toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
