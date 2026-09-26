import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  AdminNotificationFailedError,
  type SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-485: メール送信失敗時に管理者への通知送信も失敗した場合、AdminNotificationFailedError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信失敗後、管理者通知も失敗した場合、AdminNotificationFailedError が発生すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A対応とシステム改善を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new AdminNotificationFailedError('メール送信失敗の管理者通知に失敗しました。')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow(AdminNotificationFailedError);
    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow('メール送信失敗の管理者通知に失敗しました。');
  });
});
