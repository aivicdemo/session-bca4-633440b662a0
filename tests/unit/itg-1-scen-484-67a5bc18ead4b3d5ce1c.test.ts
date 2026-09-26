import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  EmailSendingFailedError,
  type SendDailyReportSubmissionNotificationInput,
  type SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-484: メール送信処理がシステム障害で失敗した場合、EmailSendingFailedError が発生して管理者に通知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信に失敗した場合、管理者に通知されること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム障害対応を実施。ログサーバーの再起動により復旧完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:00:00Z',
    };

    const result: SendDailyReportSubmissionNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メール送信に失敗しました。管理者に通知します。',
      adminNotificationSent: true,
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValue(result);

    const output = await mockedSendDailyReportSubmissionNotification(input);

    expect(output.success).toBe(false);
    expect(output.emailSendingHistoryId).toBeNull();
    expect(output.sentAt).toBeNull();
    expect(output.errorMessage).toBe('メール送信に失敗しました。管理者に通知します。');
    expect(output.adminNotificationSent).toBe(true);
  });
});
