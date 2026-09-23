import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-486: 報告者IDが空の場合、「報告者IDが指定されていません」のエラーが発生', () => {
  it('reporterId が空文字列の場合、エラーがスローされる', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: '',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施した',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Error should have been thrown for empty reporterId');
    } catch (error) {
      expect((error as Error).message).toBe('報告者IDが指定されていません');
    }
  });
});
