import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  ReporterNotValidError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-480: 報告者がシステムに登録されていない場合、ReporterNotValidError が発生', () => {
  it('報告者がシステムに未登録の状態でエラーが発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-not-exists-999',
      dailyReportId: 'daily-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('ReporterNotValidError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ReporterNotValidError);
      expect((error as Error).message).toBe('報告者が無効であるため、メール通知を送信できません。');
    }
  });
});
