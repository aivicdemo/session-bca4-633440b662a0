import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-503: リーダーのメールアドレスが登録されていない場合', () => {
  it('leaderEmailAddress が null の場合、success=false を返す', async () => {
    const input = {
      reporterId: 'reporter001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader001',
      leaderEmailAddress: null as any,
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow();
  });
});
