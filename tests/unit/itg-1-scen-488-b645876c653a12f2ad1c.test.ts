jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-488: チームリーダーのチームIDが不正な場合、validateReporterValidity で『チーム情報の取得に失敗しました』のエラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('チームリーダーのチームIDが不正な場合、エラーが発生すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は営業活動を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-invalid-id',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '報告者',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      expect(true).toBe(false);
    } catch (error) {
      expect((error as Error).message).toBe('チーム情報の取得に失敗しました');
    }
  });
});
