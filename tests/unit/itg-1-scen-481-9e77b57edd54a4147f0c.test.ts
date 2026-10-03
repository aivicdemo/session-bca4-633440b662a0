import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification, LeaderEmailAddressInvalidError } from '../../src/logic/email-notification-management';

describe('SCEN-481: リーダーメールアドレスが形式的に無効な場合、LeaderEmailAddressInvalidError が発生して通知を中止する', () => {
  it('形式が不正なメールアドレスの場合、LeaderEmailAddressInvalidError が発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A対応、提案資料作成完了',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-email-format',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressInvalidError);
    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
  });
});
