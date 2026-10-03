import { sendDailyReportSubmissionNotification, DailyReportContentInvalidError } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-511: 報告内容が空のテキストの場合、DailyReportContentInvalidError がスロー', () => {
  it('報告内容が空文字列の場合、DailyReportContentInvalidError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const error = await sendDailyReportSubmissionNotification(input).catch((e) => e);
    expect(error).toBeInstanceOf(DailyReportContentInvalidError);
    expect(error.message).toContain('報告内容が空です');
  });
});
