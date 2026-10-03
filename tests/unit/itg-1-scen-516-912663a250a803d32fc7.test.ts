import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  RecordEmailSendingHistoryInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-516: buildNotificationContent が正常にメール本文を生成した場合、recordEmailSendingHistory に渡される', () => {
  it('sendDailyReportSubmissionNotification が成功し、正しい結果を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'RPT001',
      dailyReportId: 'DR20240115001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本設計書のドラフト完了。明日は詳細設計に着手予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'LDR001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
