import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-505: 報告者名・日報内容・送信日時がすべて有効な場合のメール生成', () => {
  it('有効な入力値でメール本文が正常に生成される', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '営業先A社への訪問、提案資料作成、Q1予算申請書作成。課題: 承認フローが不透明。明日: 承認状況確認、営業先B社での引き合い対応',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
