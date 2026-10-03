import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-489: 報告者が有効に登録されている場合、validateReporterValidity は報告者情報を正常に返す', () => {
  it('報告者が有効に登録されている場合、成功する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBeTruthy();
    expect(result.sentAt).toBeTruthy();
    expect(result.errorMessage).toBeNull();
  });
});
