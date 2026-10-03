import { sendDailyReportSubmissionNotification, LeaderEmailAddressNotFoundError } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-510: リーダーのメールアドレスが登録されていない場合、LeaderEmailAddressNotFoundError がスロー', () => {
  it('リーダーメールアドレスが空文字列の場合、LeaderEmailAddressNotFoundError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: 'I completed the project tasks',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const error = await sendDailyReportSubmissionNotification(input).catch((e) => e);
    expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
    expect(error.message).toContain('リーダーのメールアドレスが設定されていません');
  });
});
