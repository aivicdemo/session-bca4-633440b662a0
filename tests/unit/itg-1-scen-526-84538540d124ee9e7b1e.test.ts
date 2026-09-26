import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  ReporterNotValidError,
  type SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-526: 報告者が無効化された状態である場合、ReporterNotValidError が発生する', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告者IDが無効化済みまたはシステムに未登録の場合、ReporterNotValidError が発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'invalid-reporter-id',
      dailyReportId: 'report-20240115',
      reportContent: '本日は顧客A社のシステム要件ヒアリングを実施した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    let thrownError: Error | undefined;
    try {
      await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeInstanceOf(ReporterNotValidError);
    expect(thrownError?.message).toBe('報告者が無効であるため、メール通知を送信できません。');
  });
});
